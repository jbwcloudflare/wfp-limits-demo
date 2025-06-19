import { gql } from "graphql-tag";

export const kvActiveNamespacesQuery = gql`
  query KvActiveNamespaces(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $cursor: string!
    $limit: uint64!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvOperationsAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            namespaceId_gt: $cursor
          }
          limit: $limit
          orderBy: [namespaceId_ASC]
        ) {
          dimensions {
            namespaceId
          }
        }
      }
    }
  }
`;

export const kvOperationsByIdsQuery = gql`
  query KvOperationsById(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $resourceIds: [string!]!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvOperationsAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            namespaceId_in: $resourceIds
          }
          limit: 10000
          orderBy: [namespaceId_ASC]
        ) {
          dimensions {
            namespaceId
          }
          sum {
            requests
            objectBytes
          }
        }
      }
    }
  }
`;

export const kvOperationsByCursorQuery = gql`
  query kvOperationsByCursor(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $cursor: string!
    $limit: uint64!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvOperationsAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            namespaceId_gt: $cursor
          }
          limit: $limit
          orderBy: [namespaceId_ASC]
        ) {
          dimensions {
            namespaceId
          }
          sum {
            requests
            objectBytes
          }
        }
      }
    }
  }
`;

export const kvStorageByIdsQuery = gql`
  query KvStorageById(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $resourceIds: [string!]!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvStorageAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            namespaceId_in: $resourceIds
          }
          limit: 10000
          orderBy: [namespaceId_ASC]
        ) {
          dimensions {
            namespaceId
          }
          max {
            keyCount
            byteCount
          }
        }
      }
    }
  }
`;

export const kvStorageByCursorQuery = gql`
  query kvStorageByCursor(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $limit: uint64!
    $cursor: string
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvStorageAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            namespaceId_gt: $cursor
          }
          limit: $limit
          orderBy: [namespaceId_ASC]
        ) {
          dimensions {
            namespaceId
          }
          max {
            keyCount
            byteCount
          }
        }
      }
    }
  }
`;
