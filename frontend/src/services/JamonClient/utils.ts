// Parse token value with its decimals to more human-readable format.
// Additionally, it parses to fixed number after floating point.
import {ethers} from "ethers";

export function tokenValueToRounded(
  value: string | bigint,
  decimals: number = 18,
  customFormatter?: (value: string) => string,
) {
  const formatted = ethers.utils.formatUnits(value, decimals);
  const parsed = parseFloat(formatted).toFixed(decimals);
  if (customFormatter) {
    return customFormatter(parsed);
  }
  return parsed;
}


// Convert human-readable value to token value with its decimals (e.g. WEI in case of ETH-like tokens).
export function valueToTokenValue(
  value: string | bigint | number,
  decimals: number = 18,
) {
  return ethers.utils.parseUnits(value.toString(), decimals).toString();
}