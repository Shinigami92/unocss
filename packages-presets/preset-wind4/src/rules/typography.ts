import type { CSSObject, CSSValueInput, Rule, RuleContext } from '@unocss/core'
import type { Theme } from '../theme'
import { colorableShadows, colorResolver, defineProperty, getStringComponent, globalKeywords, h, isCSSMathFn, numberResolver } from '../utils'
import { passThemeKey } from '../utils/constant'
import { bracketTypeRe } from '../utils/handlers/regex'

export const fonts: Rule<Theme>[] = [
  // text
  [/^text-(.+)$/, handleText, { autocomplete: 'text-$fontSize' }],

  // // text size
  [/^(?:text|font)-size-(.+)$/, handleSize, { autocomplete: 'text-size-$fontSize' }],

  // text colors
  [/^text-(?:color-)?(.+)$/, handlerColorOrSize, { autocomplete: 'text-$colors' }],

  // colors
  [/^(?:color|c)-(.+)$/, colorResolver('color', 'text')],

  // style
  [/^(?:text|color|c)-(.+)$/, ([, v]) => globalKeywords.includes(v) ? { color: v } : undefined, { autocomplete: `(text|color|c)-(${globalKeywords.join('|')})` }],

  // opacity
  [/^(?:text|color|c)-op(?:acity)?-?(.+)$/, ([, opacity]) => ({ '--un-text-opacity': h.bracket.percent.cssvar(opacity) }), { autocomplete: '(text|color|c)-(op|opacity)-<percent>' }],

  // weights
  [
    /^(?:font|fw)-?([^-]+)$/,
    ([, s], { theme }) => {
      const v = theme.fontWeight?.[s] ? `var(--font-weight-${s})` : h.bracket.global.number(s)
      return {
        '--un-font-weight': v,
        'font-weight': v,
      }
    },
    {
      autocomplete: [
        '(font|fw)-(100|200|300|400|500|600|700|800|900)',
        '(font|fw)-$fontWeight',
      ],
    },
  ],

  // leadings
  [
    /^(?:font-)?(?:leading|lh|line-height)-(.+)$/,
    ([, s], { theme }) => {
      const v = theme.leading?.[s]
        ? `var(--leading-${s})`
        : numberResolver(s)
          ? `calc(var(--spacing) * ${numberResolver(s)})`
          : h.bracket.cssvar.global.rem(s)

      if (v != null) {
        return [
          {
            '--un-leading': v,
            'line-height': v,
          },
          defineProperty('--un-leading'),
        ]
      }
    },
    { autocomplete: '(leading|lh|line-height)-$leading' },
  ],

  // synthesis
  ['font-synthesis-weight', { 'font-synthesis': 'weight' }],
  ['font-synthesis-style', { 'font-synthesis': 'style' }],
  ['font-synthesis-small-caps', { 'font-synthesis': 'small-caps' }],
  ['font-synthesis-none', { 'font-synthesis': 'none' }],
  [/^font-synthesis-(.+)$/, ([, s]) => ({ 'font-synthesis': h.bracket.cssvar.global(s) })],

  // tracking
  [
    /^(?:font-)?tracking-(.+)$/,
    ([, s], { theme }) => {
      const v = theme.tracking?.[s] ? `var(--tracking-${s})` : h.bracket.cssvar.global.rem(s)
      return {
        '--un-tracking': v,
        'letter-spacing': v,
      }
    },
    { autocomplete: 'tracking-$letterSpacing' },
  ],

  // word-spacing
  [
    /^(?:font-)?word-spacing-(.+)$/,
    ([, s], { theme }) => {
      // Use the same variable as tracking
      const v = theme.tracking?.[s] ? `var(--word-spacing-${s})` : h.bracket.cssvar.global.rem(s)
      return {
        '--un-word-spacing': v,
        'word-spacing': v,
      }
    },
    { autocomplete: 'word-spacing-$wordSpacing' },
  ],

  // stretch
  ['font-stretch-normal', { 'font-stretch': 'normal' }],
  ['font-stretch-ultra-condensed', { 'font-stretch': 'ultra-condensed' }],
  ['font-stretch-extra-condensed', { 'font-stretch': 'extra-condensed' }],
  ['font-stretch-condensed', { 'font-stretch': 'condensed' }],
  ['font-stretch-semi-condensed', { 'font-stretch': 'semi-condensed' }],
  ['font-stretch-semi-expanded', { 'font-stretch': 'semi-expanded' }],
  ['font-stretch-expanded', { 'font-stretch': 'expanded' }],
  ['font-stretch-extra-expanded', { 'font-stretch': 'extra-expanded' }],
  ['font-stretch-ultra-expanded', { 'font-stretch': 'ultra-expanded' }],
  [
    /^font-stretch-(.+)$/,
    ([, s]) => ({ 'font-stretch': h.bracket.cssvar.fraction.global(s) }),
    { autocomplete: 'font-stretch-<percentage>' },
  ],

  // family
  [
    /^font-(.+)$/,
    ([, d], { theme }) => {
      const v = theme.font?.[d] ? `var(--font-${d})` : h.bracket.cssvar.global(d)
      return {
        'font-family': v,
      }
    },
    { autocomplete: 'font-$fontFamily' },
  ],
]

export const tabSizes: Rule<Theme>[] = [
  [/^tab(?:-(.+))?$/, ([, s]) => {
    const v = h.bracket.cssvar.global.number(s || '4')
    if (v != null) {
      return {
        '-moz-tab-size': v,
        '-o-tab-size': v,
        'tab-size': v,
      }
    }
  }],
]

export const textIndents: Rule<Theme>[] = [
  [/^indent(?:-(.+))?$/, ([, s]) => {
    let v: string | number | undefined = numberResolver(s)

    if (v != null) {
      return { 'text-indent': `calc(var(--spacing) * ${v})` }
    }

    v = h.bracket.cssvar.auto.global.rem(s)

    if (v != null) {
      return { 'text-indent': v }
    }
  }],
]

export const textStrokes: Rule<Theme>[] = [
  // widths
  [/^text-stroke(?:-(.+))?$/, ([, s = 'DEFAULT'], { theme }) => {
    return {
      '-webkit-text-stroke-width': theme.textStrokeWidth?.[s]
        ? passThemeKey.includes(s) ? theme.textStrokeWidth?.[s] : `var(--text-stroke-width-${s})`
        : h.bracket.cssvar.px(s),
    }
  }, { autocomplete: 'text-stroke-$textStrokeWidth' }],

  // colors
  [/^text-stroke-(.+)$/, colorResolver('-webkit-text-stroke-color', 'text-stroke'), { autocomplete: 'text-stroke-$colors' }],
  [/^text-stroke-op(?:acity)?-?(.+)$/, ([, opacity]) => ({ '--un-text-stroke-opacity': h.bracket.percent.cssvar(opacity) }), { autocomplete: 'text-stroke-(op|opacity)-<percent>' }],
]

export const textShadows: Rule<Theme>[] = [
  [/^text-shadow(?:-(.+))?$/, ([, s = 'DEFAULT'], { theme }) => {
    const v = theme.textShadow?.[s]
    if (v != null) {
      return {
        '--un-text-shadow': colorableShadows(v, '--un-text-shadow-color').join(','),
        'text-shadow': 'var(--un-text-shadow)',
      }
    }
    return { 'text-shadow': h.bracket.cssvar.global(s) }
  }, { autocomplete: 'text-shadow-$textShadow' }],

  // colors
  [/^text-shadow-color-(.+)$/, colorResolver('--un-text-shadow-color', 'text-shadow'), { autocomplete: 'text-shadow-color-$colors' }],
  [/^text-shadow-color-op(?:acity)?-?(.+)$/, ([, opacity]) => ({ '--un-text-shadow-opacity': h.bracket.percent.cssvar(opacity) }), { autocomplete: 'text-shadow-color-(op|opacity)-<percent>' }],
]

const fontVariantNumericProperties = [
  defineProperty('--un-ordinal'),
  defineProperty('--un-slashed-zero'),
  defineProperty('--un-numeric-figure'),
  defineProperty('--un-numeric-spacing'),
  defineProperty('--un-numeric-fraction'),
].join('\n')
const baseFontVariantNumeric = {
  'font-variant-numeric': 'var(--un-ordinal) var(--un-slashed-zero) var(--un-numeric-figure) var(--un-numeric-spacing) var(--un-numeric-fraction)',
}

export const fontVariantNumeric: Rule<Theme>[] = [
  ['ordinal', [{ '--un-ordinal': 'ordinal', ...baseFontVariantNumeric }, fontVariantNumericProperties]],
  ['slashed-zero', [{ '--un-slashed-zero': 'slashed-zero', ...baseFontVariantNumeric }, fontVariantNumericProperties]],
  ['lining-nums', [{ '--un-numeric-figure': 'lining-nums', ...baseFontVariantNumeric }, fontVariantNumericProperties]],
  ['oldstyle-nums', [{ '--un-numeric-figure': 'oldstyle-nums', ...baseFontVariantNumeric }, fontVariantNumericProperties]],
  ['proportional-nums', [{ '--un-numeric-spacing': 'proportional-nums', ...baseFontVariantNumeric }, fontVariantNumericProperties]],
  ['tabular-nums', [{ '--un-numeric-spacing': 'tabular-nums', ...baseFontVariantNumeric }, fontVariantNumericProperties]],
  ['diagonal-fractions', [{ '--un-numeric-fraction': 'diagonal-fractions', ...baseFontVariantNumeric }, fontVariantNumericProperties]],
  ['stacked-fractions', [{ '--un-numeric-fraction': 'stacked-fractions', ...baseFontVariantNumeric }, fontVariantNumericProperties]],
  ['normal-nums', [{ 'font-variant-numeric': 'normal' }]],
]

function handleText([, s = 'base']: string[], { theme }: RuleContext<Theme>): CSSObject | undefined {
  const split = splitShorthand(s, 'length')
  if (!split)
    return

  const [size, leading] = split

  const sizePairs = theme.text?.[size]
  const lineHeight = leading ? theme.leading?.[leading] || h.bracket.cssvar.global.rem(leading) : undefined

  if (sizePairs) {
    return {
      'font-size': sizePairs.fontSize,
      'line-height': lineHeight ?? sizePairs.lineHeight ?? '1',
      'letter-spacing': sizePairs.letterSpacing,
    }
  }

  const fontSize = h.bracketOfLength.rem(size)
  if (lineHeight && fontSize) {
    return {
      'font-size': fontSize,
      'line-height': lineHeight,
    }
  }

  return { 'font-size': h.bracketOfLength.rem(s) }
}

function handleSize([, s]: string[], { theme }: RuleContext<Theme>): CSSObject | undefined {
  if (theme.text?.[s] != null) {
    return {
      'font-size': `var(--text-${s}-font-size)`,
      'line-height': `var(--un-leading, var(--text-${s}--line-height))`,
    }
  }
  else {
    const d = h.bracket.cssvar.global.rem(s)
    if (d)
      return { 'font-size': d }
  }
}

function handlerColorOrSize(match: RegExpMatchArray, ctx: RuleContext<Theme>): CSSObject | (CSSValueInput | string)[] | undefined {
  if (isCSSMathFn(h.bracket(match[1])))
    return handleSize(match, ctx)
  return colorResolver('color', 'text')(match, ctx)
}

export function splitShorthand(body: string, type: string) {
  const [front, rest] = getStringComponent(body, '[', ']', ['/', ':']) ?? []

  if (front != null) {
    const match = (front.match(bracketTypeRe) ?? [])[1]

    if (match == null || match === type)
      return [front, rest]
  }
}
