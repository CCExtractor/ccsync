export interface User {
  name: string;
  email: string;
  picture: string;
}

export interface Props {
  name: string;
  uuid: string;
  encryption_secret: string;
}

export interface CopyButtonProps {
  text: string;
  label: string;
}

export interface Task {
  id: number;
  description: string;
  project: string;
  tags: string[];
  status: string;
  uuid: string;
  urgency: number;
  priority: string;
  due: string;
  end: string;
  entry: string;
  modified: string;
  email: string;
}
