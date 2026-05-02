export interface Task {
  id: string;
  text: string;
  createdAt: number;
}

export type ContainerId = 'priorities' | 'backlog';

export interface AppState {
  priorities: Task[];
  backlog: Task[];
}
