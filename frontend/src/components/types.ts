// types.ts - used for home page
export interface User {
  name: string;
  email: string;
  picture: string;
}

export interface Props {
  name: string;
  uuid: string;
  encryption_secret: string;
};