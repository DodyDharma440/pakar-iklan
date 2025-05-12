export interface IQuizFormItem {
  id: string;
  selected: string[];
}

export interface IQuizForm {
  items: IQuizFormItem[];
}

export interface IResult {
  main: string;
  others: string[];
}
