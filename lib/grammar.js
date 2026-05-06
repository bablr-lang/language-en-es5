import { buildPattern } from '@bablr/helpers/builders';
import * as BList from '@bablr/agast-helpers/b-list';
import {
  eat,
  eatMatch,
  shift,
  shiftMatch,
  fail,
  o,
  r,
  m,
  exec,
  getInstrMatcher,
  startSpan,
  endSpan,
  match,
  startSubspan,
} from '@bablr/helpers/grammar';
import * as BListKeyed from '@bablr/agast-helpers/b-map';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import Space from '@bablr/language-en-blank-space';
import Comment from '@bablr/language-en-c-comments';
import { default as ES3, unaryPrefixOperatorAlternatives } from '@bablr/language-en-es3';
import Regex from './regex.js';
import { get, printSource } from '@bablr/agast-helpers/tree';
import { freeze, freezeClass } from '@bablr/agast-helpers/object';

export {
  assignmentOperators,
  assignmentOperatorAlternatives,
  unaryPrefixOperators,
  unaryPrefixOperatorAlternatives,
  unaryPostfixOperators,
  unaryPostfixOperatorAlternatives,
  getBinaryOperatorAlternatives,
} from '@bablr/language-en-es3';

export const dependencies = freeze({ Space, Comment, Regex });

export const canonicalURL = 'https://bablr.org/languages/universe/en/es5';

export const defaultMatcher = m`_+: <_Expression />`;

export const fragmentProduction = 'Fragment';

let execAtrivial = (s, m, value = o({})) => exec(s, m, value, (g) => g.atrivial);

export const reservedWords = Object.freeze([
  'arguments',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'super',
  'static',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

let reservedWords_ = new Set(reservedWords);

class ES5Atrivial extends ES3.atrivial {
  *Expression({ props: { power }, getState }) {
    let { powers } = this.constructor.context;
    let s = getState();
    let res;
    let power_ = power || powers.comma;
    if (!s.shifted) {
      if ((res = yield eatMatch(m`<ParenthesisExpression '(' />`))) {
      } else if ((res = yield eatMatch(m`<_JSONExpression />`))) {
      } else if (
        power_ >= powers.unary_prefix &&
        (res = yield eatMatch(
          m`<UnaryExpression ${printSource(buildPattern(unaryPrefixOperatorAlternatives))} />`,
        ))
      ) {
      } else if (
        power_ >= powers.new &&
        (res = yield eatMatch(m`<NewExpression 'new' />`, o({ power: power_ })))
      ) {
      } else if ((res = yield eatMatch(m`:Regex: <Pattern '/' />`, o({}), o({ held: 'eat' })))) {
      } else if ((res = yield eatMatch(m`<ThisExpression 'this' />`))) {
      } else if ((res = yield eatMatch(m`<FunctionExpression 'function' />`))) {
      } else {
        res = yield eat(m`<*Identifier />`);
      }
    } else {
      res = yield eat(m`<_LogicExpression />`, o({ power: power_ }));
    }
    if (res && !(yield match(m`/$/`))) {
      return r(shiftMatch(m`<_Expression />`, o({ power: power_ })));
    }
  }

  *FunctionExpression({ props: { shorthand } }) {
    if (!shorthand) {
      yield eat(m`sigilToken*: <*Keyword 'function' />`);
      yield eatMatch(m`name$: <*Identifier />`);
    }
    yield eat(m`openParamsToken*: <* '(' />`);
    yield startSpan('Bare', ')');
    let sep = true;
    while (sep && !(yield match(m`/$/`))) {
      yield eat(m`params[]+$: <*Identifier />`);
      sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
    }
    if (sep && sep !== true) yield fail();
    yield endSpan();
    yield eat(m`closeParamsToken*: <* ')' />`);
    yield eat(m`body*: <Block />`);
  }

  *Object() {
    yield eat(m`openToken*: <* '{' />`);
    yield startSpan('Bare', '}');
    let el = true;
    while ((el === true || get('separatorToken', el.node)) && !(yield match(m`/$/`))) {
      el = yield eat(m`elements[]: <ObjectElement />`);
    }
    yield endSpan();
    yield eat(m`closeToken*: <* '}' />`);
  }

  *ObjectElement() {
    yield eat(m`value+: <_ObjectKey />`);
    if (yield shiftMatch(m`properties[]: <Property ':' />`)) {
    } else {
      yield shift(m`<Method '(' />`);
    }
    yield eatMatch(m`separatorToken*: <* ',' />`);
  }

  *Property({ s }) {
    let { shifted } = s();
    yield eat(m`key$: <_ObjectKey />`, o({}), o({ held: 'eat' }));
    let firstToken = printSource(
      shifted.value.flags.token
        ? shifted
        : BList.getAt(1, shifted.value.bounds.leading).property.value.node,
    );
    let isIndex = /\d/.test(firstToken[0]);

    let cn =
      isIndex || reservedWords_.has(printSource(shifted))
        ? yield eat(m`mapOperator*: <* ':' />`)
        : yield eatMatch(m`mapOperator*: <* ':' />`);
    if (cn) {
      yield startSubspan(null, ',');
      yield eat(m`value+$: <_Expression />`);
      yield endSpan();
    }
  }

  *Method({ s }) {
    let iter = execAtrivial(s, m`<__FunctionExpression />`);
    let step = iter.next();

    while (!step.done) {
      let instr = step.value;
      let refName = getInstrMatcher(instr)?.reference.value.name;

      if (refName === 'name') {
        step = iter.next(yield eat(m`name$: <_ObjectKey />`, o({}), o({ held: 'eat' })));
      } else if (refName !== 'sigilToken') {
        step = iter.next(yield instr);
      } else {
        step = iter.next(null);
      }
    }
  }

  *Identifier({ props: { scoped = true } }) {
    let id = printSource(yield eat(m`/[a-zA-Z_$][a-zA-Z\d_$]*/`));
    if (scoped && reservedWords_.has(id)) yield fail();
  }
}

freezeClass(ES5Atrivial);

export default triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span.name === 'Bare',

    *Trivia({ s }) {
      let span = BListKeyed.get('Trivia', s().spans);

      let spaces = span?.props.spaces ?? Infinity;

      yield startSpan('Trivia', null, span?.props);
      let res = yield match(m`/\/\/|\/\*|[ \t][^ \t\r\n\g]|[ \n\r\t]/`);

      if (res) {
        res = printSource(res);
      }

      if (res && ' \t'.includes(res[0]) && res.length === 2 && spaces > 1) {
        yield eat(m`#: <* ' ' />`, o({}), o({ hold: true }));
      } else {
        yield eat(m`#: <Trivia />`, o({}), o({ hold: true }));
      }
      yield endSpan();
    },
  },
  ES5Atrivial,
);
