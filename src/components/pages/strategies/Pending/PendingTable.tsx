import React, { memo, useState, useCallback } from "react";
import styled from "styled-components";

import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@material-ui/core";

import ChevronDown from "@material-ui/icons/KeyboardArrowDown";
import ChevronUp from "@material-ui/icons/KeyboardArrowUp";
//import { Details } from "./Details";
import { StrategyState } from "types";
import { Loader } from "@gnosis.pm/safe-react-components";
import { decimalTruncatedString } from "utils/decimalFormat";

import { Text } from "components/basic/display/Text";
import { DeployedParams } from "components/basic/display/DeployedParams";

const HideableTableRow = styled(TableRow)`
  &.hide {
    display: none;
  }
`;

const StyledTableHeader = styled(TableHead)`
  th {
    text-transform: uppercase;
    font-weight: 400;
  }
`;

const StyledTableContainer = styled(TableContainer)`
  width: 100%;
`;

export interface Props {
  strategies: StrategyState[];
}

export const PendingTable = memo(function PendingTable({
  strategies,
}: Props): JSX.Element {
  const [foldOutStrategy, setFoldOutStrategy] = useState(null);

  const makeStrategyFoldoutHandler = useCallback((strategy: StrategyState) => {
    return () => {
      setFoldOutStrategy((currFoldoutTxHash: string) => {
        if (currFoldoutTxHash === strategy.transactionHash) {
          return null;
        }
        return strategy.transactionHash;
      });
    };
  }, []);

  const loader = <Loader size="sm" />;

  return (
    <StyledTableContainer>
      <Table>
        <StyledTableHeader>
          <TableRow>
            <TableCell>Created</TableCell>
            <TableCell>Token Pair</TableCell>
            <TableCell>Safe Nonce</TableCell>
            <TableCell>Price Range</TableCell>
            <TableCell>Brackets</TableCell>
            <TableCell />
            {/* status */}
            <TableCell />
            {/* expand */}
          </TableRow>
        </StyledTableHeader>
        <TableBody>
          {strategies.map((strategy) => (
            <>
              <TableRow
                key={strategy.transactionHash}
                hover
                onClick={makeStrategyFoldoutHandler(strategy)}
              >
                <TableCell>{strategy.created.toLocaleString()}</TableCell>
                <TableCell>
                  {strategy.quoteToken && strategy.baseToken
                    ? `${strategy.baseToken?.symbol} - ${strategy.quoteToken?.symbol}`
                    : "Unknown"}
                </TableCell>
                <TableCell>{strategy.nonce}</TableCell>
                <TableCell>
                  {!strategy.hasFetchedFunding
                    ? loader
                    : `${decimalTruncatedString(
                        strategy.priceRange.lower
                      )} - ${decimalTruncatedString(
                        strategy.priceRange.upper
                      )} ${strategy.quoteToken.symbol} per ${
                        strategy.baseToken.symbol
                      }`}
                </TableCell>
                <TableCell>
                  {strategy.brackets ? strategy.brackets.length : loader}
                </TableCell>
                <TableCell>{/* status message */}</TableCell>
                <TableCell>
                  <IconButton>
                    {strategy.transactionHash === foldOutStrategy ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
              {foldOutStrategy === strategy.transactionHash && (
                <HideableTableRow key={`${strategy.transactionHash}-foldout`}>
                  <TableCell colSpan={7} key={strategy.transactionHash}>
                    <DeployedParams strategy={strategy} />
                  </TableCell>
                </HideableTableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
});
