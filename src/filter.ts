export class FilterBuilder {
  filters: Filter[];

  constructor() {
    this.filters = [];
  }

  addFilter(filter: Filter) {
    this.filters.push(filter);
    return this;
  }

  build(operator: 'AND' | 'OR'): Filter {
    if (this.filters.length === 0) {
      throw new Error('No filters added.');
    }

    if (this.filters.length === 1) {
      return {
        ...this.filters[0],
      };
    }

    return {
      [operator.toLowerCase()]: this.filters,
    };
  }
}

export interface CheckboxFilter {
  equals?: boolean;
  does_not_equal?: boolean;
}

export interface DateFilter {
  after?: string;
  before?: string;
  equals?: string;
  is_empty?: true;
  is_not_empty?: true;
}

export interface FilesFilter {
  is_empty?: true;
  is_not_empty?: true;
}

export interface FormulaFilter {
  checkbox?: CheckboxFilter;
  date?: DateFilter;
  number?: NumberFilter;
  rich_text?: RichTextFilter;
}

export interface MultiSelectFilter {
  contains?: string;
  does_not_contain?: string;
  is_empty?: true;
  is_not_empty?: true;
}

export interface NumberFilter {
  equals?: number;
  does_not_equal?: number;
  greater_than?: number;
  greater_than_or_equal_to?: number;
  is_empty?: true;
  is_not_empty?: true;
  less_than?: number;
  less_than_or_equal_to?: number;
}

export interface PeopleFilter {
  contains?: string;
  does_not_contain?: string;
  is_empty?: true;
  is_not_empty?: true;
}

export interface RelationFilter {
  contains?: string;
  does_not_contain?: string;
  is_empty?: true;
  is_not_empty?: true;
}

export interface RichTextFilter {
  contains?: string;
  does_not_contain?: string;
  does_not_equal?: string;
  ends_with?: string;
  equals?: string;
  is_empty?: true;
  is_not_empty?: true;
  starts_with?: string;
}

export interface SelectFilter {
  equals?: string;
  does_not_equal?: string;
  is_empty?: true;
  is_not_empty?: true;
}

export interface StatusFilter {
  equals?: string;
  does_not_equal?: string;
  is_empty?: true;
  is_not_empty?: true;
}

export type Filter =
  | {
      property?: string;
      checkbox?: CheckboxFilter;
    }
  | {
      property?: string;
      date?: DateFilter;
    }
  | {
      property?: string;
      files?: FilesFilter;
    }
  | {
      property?: string;
      formula?: FormulaFilter;
    }
  | {
      property?: string;
      multi_select?: MultiSelectFilter;
    }
  | {
      property?: string;
      number?: NumberFilter;
    }
  | {
      property?: string;
      people?: PeopleFilter;
    }
  | {
      property?: string;
      relation?: RelationFilter;
    }
  | {
      property?: string;
      rich_text?: RichTextFilter;
    }
  | {
      property?: string;
      select?: SelectFilter;
    }
  | {
      property?: string;
      status?: StatusFilter;
    };
