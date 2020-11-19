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
  Box,
} from "@material-ui/core";

const CenteredBox = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
`;

import ChevronDown from "@material-ui/icons/KeyboardArrowDown";
import ChevronUp from "@material-ui/icons/KeyboardArrowUp";
import { Details } from "./Details";
import { StrategyState } from "types";
import { decimalFormat } from "utils/decimalFormat";
import { Loader, Text } from "@gnosis.pm/safe-react-components";

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
  loading: boolean;
}

export const ActiveTable = memo(function ActiveTable({
  strategies,
  loading,
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

  return (
    <StyledTableContainer>
      <Table>
        <StyledTableHeader>
          <TableRow>
            <TableCell>Deployed</TableCell>
            <TableCell>Token Pair</TableCell>
            <TableCell>Brackets</TableCell>
            <TableCell>Token A Balance</TableCell>
            <TableCell>Token B Balance</TableCell>
            <TableCell>ROI</TableCell>
            <TableCell>APY</TableCell>
            <TableCell />
            {/* status */}
            <TableCell />
            {/* expand */}
          </TableRow>
        </StyledTableHeader>
        <TableBody>
          {strategies.map((strategy) => (
            <>
              <TableRow key={strategy.transactionHash}>
                <TableCell>{strategy.created.toLocaleString()}</TableCell>
                <TableCell>
                  {strategy.quoteToken && strategy.baseToken
                    ? `${strategy.quoteToken?.symbol} - ${strategy.baseToken?.symbol}`
                    : "Unknown"}
                </TableCell>
                <TableCell>{strategy.brackets.length}</TableCell>
                <TableCell>
                  {strategy.hasFetchedBalance ? (
                    decimalFormat(strategy.baseBalance, strategy.baseToken)
                  ) : (
                    <Loader size="sm" />
                  )}
                </TableCell>
                <TableCell>
                  {strategy.hasFetchedBalance ? (
                    decimalFormat(strategy.quoteBalance, strategy.quoteToken)
                  ) : (
                    <Loader size="sm" />
                  )}
                </TableCell>
                <TableCell>TODO</TableCell>
                <TableCell>TODO</TableCell>
                <TableCell>
                  {strategy.hasErrored ? (
                    <Text size="sm" color="warning">
                      Failed to load strategy
                    </Text>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={makeStrategyFoldoutHandler(strategy)}>
                    {strategy.transactionHash === foldOutStrategy ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
              <HideableTableRow
                key={`${strategy.transactionHash}-foldout`}
                className={
                  foldOutStrategy !== strategy.transactionHash ? "hide" : ""
                }
              >
                <TableCell colSpan={9} key={strategy.transactionHash}>
                  {foldOutStrategy === strategy.transactionHash && (
                    <Details strategy={strategy} />
                  )}
                </TableCell>
              </HideableTableRow>
            </>
          ))}
          {loading && (
            <TableRow key="loading">
              <TableCell colSpan={9}>
                <CenteredBox>
                  <Loader size="sm" />
                </CenteredBox>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
});
