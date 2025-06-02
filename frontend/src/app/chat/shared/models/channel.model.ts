export interface Channel {
  _id: string;
  chatId: string;
  order: number;
  name: string;
  topic?: string;
  permissions: {
    adminsOnly?: boolean;
    readOnly?: boolean;
    allowedUsers?: string[];
    allowedRoles?: string[];
  };
}
