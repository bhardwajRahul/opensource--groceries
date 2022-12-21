export interface IToDoList {
    type: string;
    name: string;
    sharedWith: Array<string>;
}

export interface ItemRow {
    itemID: string,
    itemName: string,
    categoryID: string,
    categoryName: string,
    categorySeq: number,
    quantity: number,
    completed: boolean | null
  }

  export interface ItemSearch {
    itemID: string,
    itemName: string,
    quantity: number,
    boughtCount: number
  }

  export interface SearchState {
    searchCriteria: string,
    isOpen: boolean,
    event: Event | undefined,
    filteredSearchRows: Array<ItemSearch>,
    dismissEvent: CustomEvent | undefined
  }

  export interface PageState {
    selectedListID: string,
    doingUpdate: boolean,
    itemRows: Array<ItemRow>,
    showAlert: boolean,
    alertHeader: string,
    alertMessage: string
  }

  export interface DBCreds {
    apiServerURL: string | null,
    couchBaseURL: string | null,
    database: string | null,
    dbUsername: string | null,
    email: string | null,
    fullName: string | null,
    JWT: string | null,
    remoteDBUUID: string | null
  }

  export const DBCredsInit: DBCreds = {
    apiServerURL: null, couchBaseURL: null, database: null,
    dbUsername: null, email: null, fullName: null, JWT: null, remoteDBUUID: null
  }

  export enum FriendStatus {
    PendingFrom1 = "PENDFROM1",
    PendingFrom2 = "PENDFROM2",
    WaitingToRegister = "WAITREGISTER",
    RegisteredNotConfirmed = "REFNOTCONF", // do we need this, or reverts to pendfrom1 I think!
    Confirmed = "CONFIRMED",
    Deleted = "DELETED"
  }

  export enum ResolvedFriendStatus {
    PendingConfirmation = "PENDING",
    Requested = "REQUESTED",
    WaitingToRegister= "WAITREGISTER",
    Confirmed = "CONFIRMED",
    Deleted = "DELETED"
  }

  export type FriendRow = {
    friendDoc: any,
    targetUserName: string,
    targetEmail: string,
    targetFullName: string,
    resolvedStatus: ResolvedFriendStatus
    friendStatusText: string,
  }

  export type PouchResponse = {
    pouchData: any,
    successful: boolean,
    errorCode: number,
    errorText: string,
    fullError: any
  }
