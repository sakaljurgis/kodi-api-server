import { TitleTypeEnum } from '../../Shared/Enum/title-type.enum';

export enum TitleRuleKind {
  /** a release folder or a file: its files are this title */
  path = 'path',
  /** a listed title is renamed / switched to movie or show / merged into another */
  title = 'title',
  /** parsed titles containing this text are this title (the old aliases) */
  contains = 'contains',
}

export interface TitleRule {
  id: string;
  kind: TitleRuleKind;
  /**
   * path: a relative path, or the start of one up to a "/" (release folder);
   * title: a title as listed (any case); contains: text in the parsed title (any case)
   */
  match: string;
  /** title rules: only the title of this type */
  matchType?: TitleTypeEnum;
  title?: string;
  type?: TitleTypeEnum;
  /** path rules */
  season?: number;
  createdAt: number;
}

export interface ResolvedTitle {
  title: string;
  type: TitleTypeEnum;
  season?: number;
  /** the title name was set by a rule, so its exact case matters */
  exactTitle: boolean;
}

export function matchesPath(rule: TitleRule, relativePath: string): boolean {
  return (
    relativePath === rule.match || relativePath.startsWith(rule.match + '/')
  );
}

const sameText = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * The parsed title, season and type, changed by the rules:
 * 1. the path rule with the longest match (a file wins over its folder),
 * 2. if that didn't set the title, the first contains rule,
 * 3. title rules, followed on (a merged title that was merged again).
 * A show needs a season to be listed, so 1 if there's none.
 */
export function applyTitleRules(
  rules: TitleRule[],
  relativePath: string,
  parsed: { title: string; season?: number },
): ResolvedTitle {
  let title = parsed.title;
  let season = parsed.season;
  // season 0 (specials) is a show's too
  let type = season == null ? TitleTypeEnum.movie : TitleTypeEnum.show;
  let exactTitle = false;

  const pathRule = rules
    .filter(
      (rule) =>
        rule.kind === TitleRuleKind.path && matchesPath(rule, relativePath),
    )
    .sort((a, b) => b.match.length - a.match.length)[0];

  if (pathRule?.title) {
    title = pathRule.title;
    exactTitle = true;
  } else {
    const containsRule = rules.find(
      (rule) =>
        rule.kind === TitleRuleKind.contains &&
        title.toLowerCase().includes(rule.match.toLowerCase()),
    );
    if (containsRule) {
      title = containsRule.title;
      exactTitle = true;
    }
  }
  type = pathRule?.type ?? type;
  season = pathRule?.season ?? season;

  const applied = new Set<TitleRule>();
  for (;;) {
    const titleRule = rules.find(
      (rule) =>
        rule.kind === TitleRuleKind.title &&
        !applied.has(rule) &&
        sameText(rule.match, title) &&
        (!rule.matchType || rule.matchType === type),
    );
    if (!titleRule) {
      break;
    }
    applied.add(titleRule);
    if (titleRule.title) {
      title = titleRule.title;
      exactTitle = true;
    }
    type = titleRule.type ?? type;
  }

  if (type === TitleTypeEnum.show && season == null) {
    season = 1;
  }

  return { title, type, season, exactTitle };
}
