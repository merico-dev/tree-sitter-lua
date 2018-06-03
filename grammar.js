const PREC = {
  COMMA: -1,
  PRIORITY: 1,

  OR: 1,        //=> or
  AND: 2,       //=> and
  COMPARE: 3,   //=> < <= == ~= >= >
  BIT_OR: 4,    //=> |
  BIT_NOT: 5,   //=> ~
  BIT_AND: 6,   //=> &
  SHIFT: 7,     //=> << >>
  CONCAT: 8,    //=> ..
  PLUS: 9,      //=> + -
  MULTI: 10,    //=> * / // %
  UNARY: 11,    //=> not # - ~
  POWER: 12     //=> ^
};

module.exports = grammar({
  name: 'lua',

  extras: $ => [
    $.comment,
    /[\s\n]/
  ],

  externals: $ => [
    $.comment,
    $._multiline_string
  ],

  rules: {
    lua: $ => repeat($._statement),

    // Statements
    _statement: $ => choice(
      alias($._expression, $.expression)
    ),

    // Expressions
    _expression: $ => choice(
      $.spread,

      $.binary_expression,

      $.string,
      $.number,
      $.nil,
      $.true,
      $.false,
      $.identifier
    ),

    spread: $ => '...',

    // Operations
    binary_expression: $ => choice(
      ...[
        ['or', PREC.OR],
        ['and', PREC.AND],
        ['<', PREC.COMPARE],
        ['<=', PREC.COMPARE],
        ['==', PREC.COMPARE],
        ['~=', PREC.COMPARE],
        ['>=', PREC.COMPARE],
        ['>', PREC.COMPARE],
        ['|', PREC.BIT_OR],
        ['~', PREC.BIT_NOT],
        ['&', PREC.BIT_AND],
        ['<<', PREC.SHIFT],
        ['>>', PREC.SHIFT],
        ['+', PREC.PLUS],
        ['-', PREC.PLUS],
        ['*', PREC.MULTI],
        ['/', PREC.MULTI],
        ['//', PREC.MULTI],
        ['%', PREC.MULTI],
      ].map(([operator, precedence]) => prec.left(precedence, seq(
        $._expression,
        operator,
        $._expression
      ))),
      ...[
        ['..', PREC.CONCAT],
        ['^', PREC.POWER],
      ].map(([operator, precedence]) => prec.right(precedence, seq(
        $._expression,
        operator,
        $._expression
      )))
    ),

    // Primitives
    string: $ => choice(
      seq("'", repeat(choice(/[^\\'\n]/, /\\./)), "'"),
      seq('"', repeat(choice(/[^\\"\n]/, /\\./)), '"'),
      $._multiline_string
    ),

    number: $ => {
      const
        decimal_digits = /[0-9]+/;
        signed_integer = seq(optional(choice('-', '+')), decimal_digits);
        decimal_exponent_part = seq(choice('e', 'E'), signed_integer);

        decimal_integer_literal = choice(
          '0',
          seq(optional('0'), /[1-9]/, optional(decimal_digits))
        );

        hex_digits = /[a-fA-F0-9]+/;
        hex_exponent_part = seq(choice('p', 'P'), signed_integer);

        decimal_literal = choice(
          seq(decimal_integer_literal, '.', optional(decimal_digits), optional(decimal_exponent_part)),
          seq('.', decimal_digits, optional(decimal_exponent_part)),
          seq(decimal_integer_literal, optional(decimal_exponent_part))
        );

        hex_literal = seq(
          choice('0x', '0X'),
          hex_digits,
          optional(seq('.', hex_digits)),
          optional(hex_exponent_part)
        );

      return token(choice(
        decimal_literal,
        hex_literal
      ));
    },

    nil: $ => 'nil',
    true: $ => 'true',
    false: $ => 'false',

    // Identifiers
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/
  }
});