import { useTheme } from 'styled-components'
import chroma from 'chroma-js'
import get from 'lodash.get'
import toPairs from 'lodash.topairs'
import fromPairs from 'lodash.frompairs'
import { getDeepKeys } from './lib'
import { type DeepReplace } from './types'

const PALETTE_KEY = '_palette' as const

export const createColorHelper = <TTheme extends { [PALETTE_KEY]: {} }>(
  theme: TTheme
) => {
  type WithTheme<T = unknown> = { theme: TTheme } & T
  type TPalette = typeof theme[typeof PALETTE_KEY]
  type TPaletteColorBase = (p: WithTheme) => string
  type TPaletteColor = TPaletteColorBase & {
    alpha: (alpha: number) => TPaletteColorBase
    brighten: (amount?: number) => TPaletteColorBase
    darken: (amount?: number) => TPaletteColorBase
    chroma: (
      pred: (chromaColor: chroma.Color) => chroma.Color | string
    ) => TPaletteColorBase
  }

  const palettePathList = PALETTE_KEY.split('.') as (number | string)[]

  const paletteBase = get(theme, palettePathList) as TPalette

  const getPaletteColor = (
    colorPath: typeof palettePathList,
    modPredicate?: (color: string, theme: TTheme) => string
  ) => {
    function PaletteColor({ theme }: WithTheme) {
      // Color is always there because we crawl through theme
      const color = get(theme, colorPath)! as string
      return modPredicate ? modPredicate(color, theme) : color
    }

    return PaletteColor as TPaletteColor
  }

  // @ts-ignore
  const crawl = (part: unknown, partPath = palettePathList) => {
    if (typeof part === 'string') {
      const paletteColor = getPaletteColor(partPath)
      paletteColor.alpha = (amount) =>
        getPaletteColor(partPath, (color) => chroma(color).alpha(amount).css())
      paletteColor.brighten = (amount) =>
        getPaletteColor(partPath, (color) =>
          chroma(color).brighten(amount).css()
        )
      paletteColor.darken = (amount) =>
        getPaletteColor(partPath, (color) => chroma(color).darken(amount).css())
      paletteColor.chroma = (pred) =>
        getPaletteColor(partPath, (color) => {
          const stringOrChromaColor = pred(chroma(color))
          return typeof stringOrChromaColor !== 'string'
            ? stringOrChromaColor.hex()
            : stringOrChromaColor
        })

      return paletteColor
    }

    if (Array.isArray(part)) {
      return part.map((value, i) => crawl(value, [...partPath, i]))
    }

    if (typeof part === 'object') {
      const entries = toPairs(part as Record<string, unknown>)
      // @ts-ignore
      const done = entries.map(([key, nextPart]) => [
        key,
        crawl(nextPart as unknown, [...partPath, key]),
      ])
      return fromPairs(done)
    }

    return part
  }

  const palette = crawl(paletteBase) as DeepReplace<
    TPalette,
    string,
    TPaletteColor
  >

  const usePalette = (paletteColor: TPaletteColor) => {
    const theme = useTheme() as TTheme
    return paletteColor({ theme })
  }

  return { palette, usePalette }
}

const createThemes = <
  TPalettes extends Record<string, unknown>[],
  TThemeBase extends Record<string, unknown>
>(
  palettes: TPalettes,
  themeBase?: TThemeBase
) => {
  const firstPaletteKeys = getDeepKeys(palettes[0])
  const mismatchingPaletteIndex = palettes.findIndex(
    (palette) => getDeepKeys(palette) !== firstPaletteKeys
  )

  if (mismatchingPaletteIndex !== -1) {
    const errorMessage = `Palettes don't match: palettes[${mismatchingPaletteIndex}] !== palettes[0]`
    throw new Error(errorMessage)
  }

  const themes = palettes.map((palette: TPalettes[number]) => {
    return {
      ...themeBase,
      [PALETTE_KEY]: palette,
    }
  }) as (TThemeBase & { [PALETTE_KEY]: TPalettes[number] })[]

  const { palette, usePalette } = createColorHelper(themes[0])

  return {
    themes,
    palette,
    usePalette,
  }
}

export default createThemes
