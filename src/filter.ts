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

export type CheckboxFilter = {
  equals?: boolean;
  does_not_equal?: boolean;
};

export type DateFilter = {
  after?: string;
  before?: string;
  equals?: string;
  is_empty?: true;
  is_not_empty?: true;
};

export type FilesFilter = {
  is_empty?: true;
  is_not_empty?: true;
};

export type FormulaFilter = {
  checkbox?: CheckboxFilter;
  date?: DateFilter;
  number?: NumberFilter;
  rich_text?: RichTextFilter;
};

export type MultiSelectFilter = {
  contains?: string;
  does_not_contain?: string;
  is_empty?: true;
  is_not_empty?: true;
};

export type NumberFilter = {
  equals?: number;
  does_not_equal?: number;
  greater_than?: number;
  greater_than_or_equal_to?: number;
  is_empty?: true;
  is_not_empty?: true;
  less_than?: number;
  less_than_or_equal_to?: number;
};

export type PeopleFilter = {
  contains?: string;
  does_not_contain?: string;
  is_empty?: true;
  is_not_empty?: true;
};

export type RelationFilter = {
  contains?: string;
  does_not_contain?: string;
  is_empty?: true;
  is_not_empty?: true;
};

export type RichTextFilter = {
  contains?: string;
  does_not_contain?: string;
  does_not_equal?: string;
  ends_with?: string;
  equals?: string;
  is_empty?: true;
  is_not_empty?: true;
  starts_with?: string;
};

export type RollupFilter = {
  any?: Object;
  every?: Object;
  none?: Object;
};

export type SelectFilter = {
  equals?: string;
  does_not_equal?: string;
  is_empty?: true;
  is_not_empty?: true;
};

export type StatusFilter = {
  equals?: string;
  does_not_equal?: string;
  is_empty?: true;
  is_not_empty?: true;
};

export type IdFilter = {
  does_not_equal?: number;
  equals?: number;
  greater_than?: number;
  greater_than_or_equal_to?: number;
  less_than?: number;
  less_than_or_equal_to?: number;
};

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
      rollup?: RollupFilter;
    }
  | {
      property?: string;
      select?: SelectFilter;
    }
  | {
      property?: string;
      status?: StatusFilter;
    }
  | {
      property?: string;
      title?: RichTextFilter;
    }
  | {
      timestamp?: 'created_time' | 'last_edited_time';
      created_time?: DateFilter;
      last_edited_time?: DateFilter;
    }
  | {
      property?: string;
      unique_id?: IdFilter;
    };
