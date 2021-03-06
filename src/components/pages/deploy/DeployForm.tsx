import React, { memo, useCallback, useContext } from "react";
import { useRecoilValue } from "recoil";
import { MutableState, Mutator, Tools } from "final-form";
import { Form, FormRenderProps } from "react-final-form";
import createCalculatedFieldsDecorator, {
  Calculation,
} from "final-form-calculate";

import { useDeployStrategy } from "hooks/useDeployStrategy";

import { setFieldData, setFieldValue } from "utils/finalForm";
import { calculateBrackets } from "utils/calculateBrackets";

import { tokenBalancesState } from "state/atoms";

import { ValidationErrors } from "validators/types";
import { isGreaterThan } from "validators/isGreaterThan";
import { isNumber } from "validators/isNumber";
import { isRequired } from "validators/isRequired";
import { hasBalanceFactory } from "validators/hasBalance";
import { composeValidators } from "validators/misc";

import { ContractInteractionContext } from "components/context/ContractInteractionProvider";

import { DeployFormValues, FormFields } from "./types";

// Calculate brackets based on all form fields
// Creates 3 calculated fields:
// - baseTokenBrackets
// - quoteTokenBrackets
// - bracketsSizes
const updateCalculatedBracketsFactory = (
  field: FormFields | RegExp
): Calculation => ({
  field,
  updates: (
    _value: any,
    _name: any,
    allValues: DeployFormValues
  ): Partial<DeployFormValues> => {
    const { lowestPrice, startPrice, highestPrice, totalBrackets } = allValues;
    const {
      baseTokenBrackets,
      quoteTokenBrackets,
      bracketsSizes,
    } = calculateBrackets({
      lowestPrice,
      startPrice,
      highestPrice,
      totalBrackets,
    });

    return {
      baseTokenBrackets: baseTokenBrackets.toString(),
      quoteTokenBrackets: quoteTokenBrackets.toString(),
      bracketsSizes: bracketsSizes.join("|"),
    };
  },
});

// To be used on the swap tokens arrow
const swapTokens: Mutator = (
  _: any[],
  state: MutableState<any>, // not happy with DeployFormValues type :/
  { getIn, changeValue }: Tools<any>
) => {
  changeValue(state, "baseTokenAddress", () =>
    getIn(state, "quoteTokenAddress")
  );
  changeValue(state, "quoteTokenAddress", () =>
    getIn(state, "baseTokenAddress")
  );
};

// To be used inside calculate field decorator
const swapTokensCalculationFactory = (
  field: FormFields,
  oppositeField: FormFields
): Calculation => ({
  field,
  updates: {
    [oppositeField]: (
      value: string,
      allValues: DeployFormValues,
      prevValues: DeployFormValues
    ): string =>
      value === allValues[oppositeField]
        ? prevValues[field]
        : allValues[oppositeField],
  },
});

const calculateFieldsDecorator = createCalculatedFieldsDecorator(
  // Calculate brackets whenever (lowest/start/highest)Price or totalBrackets change
  updateCalculatedBracketsFactory(/Price$/),
  updateCalculatedBracketsFactory("totalBrackets"),
  // Whenever one of the select changes update the opposite selector
  swapTokensCalculationFactory("baseTokenAddress", "quoteTokenAddress"),
  swapTokensCalculationFactory("quoteTokenAddress", "baseTokenAddress")
);

interface Props {
  children: React.ReactNode;
}

export const DeployForm = memo(function DeployForm({
  children,
}: Props): React.ReactElement {
  const context = useContext(ContractInteractionContext);
  const { getErc20Details } = context;
  const tokenBalances = useRecoilValue(tokenBalancesState);

  const hasBalance = useCallback(
    (tokenAddress: string) =>
      hasBalanceFactory(getErc20Details)(
        tokenAddress,
        tokenBalances[tokenAddress] // TODO: show a warning when not able to fetch token balance?
      ),
    [tokenBalances, getErc20Details]
  );

  const validate = useCallback(
    async (values: DeployFormValues): Promise<ValidationErrors> => {
      const errors: ValidationErrors = {};

      // prices values
      const lowestPrice = Number(values.lowestPrice);
      const highestPrice = Number(values.highestPrice);

      // this is a calculated field where we store two integers in a single string
      const baseTokenBrackets = Number(values.baseTokenBrackets);
      const quoteTokenBrackets = Number(values.quoteTokenBrackets);

      if (lowestPrice >= highestPrice) {
        errors["lowestPrice"] = {
          label: "Lowest Price must be smaller than Highest Price",
        };
        errors["highestPrice"] = true;
      }

      // Validate only if/when set
      if (baseTokenBrackets > 0) {
        errors["baseTokenAmount"] = await composeValidators("Token A Funding", [
          isRequired(),
          isNumber(),
          isGreaterThan(0),
          hasBalance(values.baseTokenAddress),
        ])(values.baseTokenAmount);
      }

      if (quoteTokenBrackets > 0) {
        errors["quoteTokenAmount"] = await composeValidators(
          "Token B Funding",
          [
            isRequired(),
            isNumber(),
            isGreaterThan(0),
            hasBalance(values.quoteTokenAddress),
          ]
        )(values.quoteTokenAmount);
      }

      return errors;
    },
    [hasBalance]
  );

  const deployStrategy = useDeployStrategy();

  const onSubmit = useCallback(
    async (values: DeployFormValues): Promise<undefined | ValidationErrors> =>
      deployStrategy(values),
    [deployStrategy]
  );

  const afterFormSubmitFactory = useCallback(
    (
      handleSubmit: FormRenderProps["handleSubmit"],
      // form: FormRenderProps["form"]  // this is the proper type, but it doesn't contain `restart`
      // -> https://final-form.org/docs/final-form/types/FormApi
      form: any
    ) => async (
      ...params: Parameters<FormRenderProps["handleSubmit"]>
    ): Promise<ReturnType<FormRenderProps["handleSubmit"]>> => {
      const result = await handleSubmit(...params);

      // When result === `undefined`, deploy succeeded.
      // That is, all the data is correct and tx was submitted to the Safe.
      // From them on, up to the user to confirm/cancel the submission
      if (result === undefined) {
        console.log("Clearing the form");
        form.restart();
      }
      return result;
    },
    []
  );

  return (
    // TODO: if I set the form type like this, TS goes bananas with mutator type
    // <Form<DeployFormValues>
    <Form
      onSubmit={onSubmit}
      mutators={{ setFieldData, setFieldValue, swapTokens }}
      decorators={[calculateFieldsDecorator]}
      validate={validate}
      render={({ handleSubmit, form }) => (
        <form onSubmit={afterFormSubmitFactory(handleSubmit, form)}>
          {children}
        </form>
      )}
    />
  );
});
