import React, { memo } from "react";

import { StrategyState } from "types";

import { useCalculateValues } from "hooks/useCalculateValues";

import { StrategyTotalValueViewer } from "./viewer";

export type Props = {
  strategy: StrategyState;
};

export const StrategyTotalValue = memo(function StrategyTotalValue(
  props: Props
): JSX.Element {
  const { strategy } = props;

  const { isLoading, totalValue, holdValue, roi, apr } = useCalculateValues({
    strategy,
  });

  return (
    <StrategyTotalValueViewer
      totalValue={{ value: totalValue, isLoading }}
      holdValue={{ value: holdValue, isLoading }}
      roi={{ value: roi, isLoading }}
      apr={{ value: apr, isLoading }}
    />
  );
});
