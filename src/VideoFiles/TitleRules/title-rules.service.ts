import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JsonFileDataStorageService } from '../../DataStorage/json-file-data-storage.service';
import { TitleTypeEnum } from '../../Shared/Enum/title-type.enum';
import {
  applyTitleRules,
  ResolvedTitle,
  TitleRule,
  TitleRuleKind,
} from './title-rule';

const STORAGE_KEY = 'title-rules';

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === '';

/**
 * Fixes for parsed titles, kept in db/title-rules.json so they survive
 * re-scans. Started from the old aliases (db/aliases.json, still on disk).
 */
@Injectable()
export class TitleRulesService {
  private loading: Promise<TitleRule[]>;

  constructor(private readonly storage: JsonFileDataStorageService) {}

  getRules(): Promise<TitleRule[]> {
    this.loading = this.loading ?? this.load();
    return this.loading;
  }

  async resolve(
    relativePath: string,
    parsed: { title: string; season?: number },
  ): Promise<ResolvedTitle> {
    return applyTitleRules(await this.getRules(), relativePath, parsed);
  }

  /**
   * Replaces a rule matching the same thing. A title rule undoing an
   * existing one (B → A after A → B) just removes that one.
   */
  async saveRule(input: Partial<TitleRule>): Promise<TitleRule[]> {
    const rule = this.validate(input);
    const rules = await this.getRules();

    const reverse = rules.find((existing) => this.isReverse(existing, rule));
    if (reverse) {
      return this.store(rules.filter((existing) => existing !== reverse));
    }

    return this.store([
      ...rules.filter((existing) => !this.isSameMatch(existing, rule)),
      rule,
    ]);
  }

  async deleteRule(id: string): Promise<TitleRule[]> {
    const rules = await this.getRules();
    return this.store(rules.filter((rule) => rule.id !== id));
  }

  private async load(): Promise<TitleRule[]> {
    const rules = await this.storage.get<TitleRule[] | null>(STORAGE_KEY, null);
    if (rules) {
      return rules;
    }

    const aliases = await this.storage.get<[string, string][]>('aliases', []);
    const now = Date.now();
    const seeded = aliases
      .filter(([match, title]) => match && title)
      .map(([match, title]) => ({
        id: randomUUID(),
        kind: TitleRuleKind.contains,
        match,
        title,
        createdAt: now,
      }));
    await this.storage.set(STORAGE_KEY, seeded);

    return seeded;
  }

  private async store(rules: TitleRule[]): Promise<TitleRule[]> {
    await this.storage.set(STORAGE_KEY, rules);
    this.loading = Promise.resolve(rules);

    return rules;
  }

  private validate(input: Partial<TitleRule>): TitleRule {
    const kind = input.kind;
    if (!Object.values(TitleRuleKind).includes(kind)) {
      throw new BadRequestException(`unknown rule kind ${kind}`);
    }

    const rule: TitleRule = {
      id: randomUUID(),
      kind,
      match: this.text(input.match),
      title: this.text(input.title),
      type: this.titleType(input.type),
      createdAt: Date.now(),
    };
    if (!rule.match) {
      throw new BadRequestException('nothing to match');
    }

    if (kind === TitleRuleKind.title) {
      rule.matchType = this.titleType(input.matchType);
    }

    if (kind === TitleRuleKind.path && !isEmpty(input.season)) {
      const season = Number(input.season);
      if (!Number.isInteger(season) || season < 1) {
        throw new BadRequestException(`season must be 1 or more`);
      }
      rule.season = season;
    }

    if (kind === TitleRuleKind.contains && !rule.title) {
      throw new BadRequestException('a contains rule needs a title');
    }
    const changesNothing =
      kind === TitleRuleKind.title
        ? (rule.title ?? rule.match) === rule.match &&
          (rule.type ?? rule.matchType) === rule.matchType
        : !rule.title && !rule.type && !rule.season;
    if (changesNothing) {
      throw new BadRequestException('the rule changes nothing');
    }

    return rule;
  }

  private text(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim()
      ? value.trim().replace(/\s+/g, ' ')
      : undefined;
  }

  private titleType(value: unknown): TitleTypeEnum | undefined {
    if (isEmpty(value)) {
      return undefined;
    }
    if (value === TitleTypeEnum.movie || value === TitleTypeEnum.show) {
      return value;
    }
    throw new BadRequestException(`unknown type ${value}`);
  }

  private isSameMatch(a: TitleRule, b: TitleRule): boolean {
    if (a.kind !== b.kind) {
      return false;
    }
    if (a.kind === TitleRuleKind.path) {
      return a.match === b.match;
    }

    return (
      a.match.toLowerCase() === b.match.toLowerCase() &&
      (a.matchType ?? null) === (b.matchType ?? null)
    );
  }

  /** "B (movie) → A (show)" when "A (show) → B (movie)" exists */
  private isReverse(existing: TitleRule, rule: TitleRule): boolean {
    if (
      existing.kind !== TitleRuleKind.title ||
      rule.kind !== TitleRuleKind.title
    ) {
      return false;
    }
    const target = (r: TitleRule) => ({
      title: (r.title ?? r.match).toLowerCase(),
      type: r.type ?? r.matchType ?? null,
    });

    return (
      existing.match.toLowerCase() === target(rule).title &&
      (existing.matchType ?? null) === target(rule).type &&
      target(existing).title === rule.match.toLowerCase() &&
      target(existing).type === (rule.matchType ?? null)
    );
  }
}
