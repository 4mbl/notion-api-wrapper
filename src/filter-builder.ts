import type * as Notion from './notion-types.js';

export type BuiltFilter = Notion.QueryDataSourceParameters['filter'];

type NestableFilter = Filter | BuiltFilter;

export class FilterBuilder {
  filters: NestableFilter[];

  constructor() {
    this.filters = [];
  }

  addFilter(filter: NestableFilter | undefined) {
    if (filter) this.filters.push(filter);
    return this;
  }

  build(operator: 'AND' | 'OR'): BuiltFilter | undefined {
    if (this.filters.length === 0) {
      return {} as BuiltFilter;
    }

    if (this.filters.length === 1) {
      return this.filters[0];
    }

    return {
      [operator.toLowerCase()]: this.filters,
    } as BuiltFilter;
  }
}

/* PARTIAL FILTERS */

type EmptyObject = Record<string, never>;

type ExistencePropertyFilter = { is_empty: true } | { is_not_empty: true };

type StringContainmentFilter =
  | { contains: string }
  | { does_not_contain: string };

type TextPropertyFilter =
  | StringContainmentFilter
  | { equals: string }
  | { does_not_equal: string }
  | { starts_with: string }
  | { ends_with: string };

type RollupSubfilterPropertyFilter =
  | { rich_text: TextPropertyFilter }
  | { number: NumberFilter }
  | { checkbox: CheckboxFilter }
  | { select: SelectFilter }
  | { multi_select: MultiSelectFilter }
  | { relation: RelationFilter }
  | { date: DateFilter }
  | { people: PeopleFilter }
  | { files: ExistencePropertyFilter }
  | { status: StatusFilter };

/* PROPERTY FILTERS */

export type CheckboxFilter = { equals: boolean } | { does_not_equal: boolean };

export type DateFilter =
  | { equals: string }
  | { before: string }
  | { after: string }
  | { on_or_before: string }
  | { on_or_after: string }
  | { this_week: EmptyObject }
  | { past_week: EmptyObject }
  | { past_month: EmptyObject }
  | { past_year: EmptyObject }
  | { next_week: EmptyObject }
  | { next_month: EmptyObject }
  | { next_year: EmptyObject }
  | ExistencePropertyFilter;

export type FilesFilter = ExistencePropertyFilter;

export type FormulaFilter =
  | { checkbox: CheckboxFilter }
  | { date: DateFilter }
  | { number: NumberFilter }
  | { string: TextPropertyFilter };

export type MultiSelectFilter =
  | StringContainmentFilter
  | ExistencePropertyFilter;

export type NumberFilter =
  | ({ equals: number } | { does_not_equal: number })
  | ({ greater_than: number } | { greater_than_or_equal_to: number })
  | ({ less_than: number } | { less_than_or_equal_to: number })
  | ExistencePropertyFilter;

export type PeopleFilter = StringContainmentFilter | ExistencePropertyFilter;

type RelationFilter = StringContainmentFilter;

export type RollupFilter =
  | { any: RollupSubfilterPropertyFilter }
  | { none: RollupSubfilterPropertyFilter }
  | { every: RollupSubfilterPropertyFilter }
  | { date: DateFilter }
  | { number: NumberFilter };

export type RichTextFilter = TextPropertyFilter | ExistencePropertyFilter;

export type SelectFilter =
  | { equals: string }
  | { does_not_equal: string }
  | ExistencePropertyFilter;

export type StatusFilter =
  | { equals: string }
  | { does_not_equal: string }
  | ExistencePropertyFilter;

export type IdFilter = NumberFilter;

export type Filter =
  | ({ property: string } & (
      | {
          type?: 'checkbox' | undefined;
          checkbox: CheckboxFilter;
        }
      | {
          type?: 'date' | undefined;
          date: DateFilter;
        }
      | {
          type?: 'files' | undefined;
          files: FilesFilter;
        }
      | {
          type?: 'formula' | undefined;
          formula: FormulaFilter;
        }
      | {
          type?: 'multi_select' | undefined;
          multi_select: MultiSelectFilter;
        }
      | {
          type?: 'number' | undefined;
          number: NumberFilter;
        }
      | {
          type?: 'people' | undefined;
          people: PeopleFilter;
        }
      | {
          type?: 'relation' | undefined;
          relation: RelationFilter;
        }
      | {
          type?: 'rich_text' | undefined;
          rich_text: RichTextFilter;
        }
      | {
          type?: 'rollup' | undefined;
          rollup: RollupFilter;
        }
      | {
          type?: 'select' | undefined;
          select: SelectFilter;
        }
      | {
          type?: 'status' | undefined;
          status: StatusFilter;
        }
      | {
          type?: 'unique_id' | undefined;
          unique_id: IdFilter;
        }
    ))
  | (
      | {
          created_time: DateFilter;
          timestamp: 'created_time';
          type?: 'created_time';
        }
      | {
          last_edited_time: DateFilter;
          timestamp: 'last_edited_time';
          type?: 'last_edited_time';
        }
    );
