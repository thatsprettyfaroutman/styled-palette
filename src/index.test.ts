import createThemes from '.'

const THEME_BASE = {
  spacing: 16,
  borderWidth: 3,
} as const

const LIGHT_PALETTE = {
  outer: '#f8f8f8',
  main: {
    bg: '#C1E9E9',
    fg: '#333',
  },
  border: '#333',
}

const DARK_PALETTE = {
  outer: '#101010',
  main: {
    bg: '#181818',
    fg: '#C1E9E9',
  },
  border: '#000',
}

const FAULTY_DARK_PALETTE = {
  keysDontMatch: {
    nope: {
      bg: '#f0f',
    },
  },
}

test('Create palette', () => {
  const { themes, palette } = createThemes(
    [LIGHT_PALETTE, DARK_PALETTE],
    THEME_BASE
  )

  /*
    ${({theme}) => theme.palette.main.bg}

    vs.

    palette.main.bg
  */

  expect(themes[0]).toStrictEqual({
    ...THEME_BASE,
    _palette: LIGHT_PALETTE,
  })
  expect(themes[1]).toStrictEqual({
    ...THEME_BASE,
    _palette: DARK_PALETTE,
  })
  expect(palette.outer).toBeInstanceOf(Function)
  expect(palette.outer({ theme: themes[0] })).toEqual(LIGHT_PALETTE.outer)
  expect(palette.main.bg({ theme: themes[0] })).toEqual(LIGHT_PALETTE.main.bg)
})

test('Match palette structures', () => {
  expect(() =>
    createThemes([LIGHT_PALETTE, FAULTY_DARK_PALETTE])
  ).toThrowError()
})
