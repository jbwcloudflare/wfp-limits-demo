import { gql } from "graphql-tag";

export const kvActiveNamespacesQuery = gql`
  query KvActiveNamespaces(
    $accountTag: string!
    $startDate: Date!
    $endDate: Date!
    $cursor: string!
    $limit: uint64!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvOperationsAdaptiveGroups(
          filter: {
            date_geq: $startDate
            date_leq: $endDate
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
    $startDate: Date!
    $endDate: Date!
    $resourceIds: [string!]!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvOperationsAdaptiveGroups(
          filter: {
            date_geq: $startDate
            date_leq: $endDate
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
    $startDate: Date!
    $endDate: Date!
    $cursor: string!
    $limit: uint64!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvOperationsAdaptiveGroups(
          filter: {
            date_geq: $startDate
            date_leq: $endDate
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
    $startDate: Date!
    $endDate: Date!
    $resourceIds: [string!]!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvStorageAdaptiveGroups(
          filter: {
            date_geq: $startDate
            date_leq: $endDate
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
    $startDate: Date!
    $endDate: Date!
    $limit: uint64!
    $cursor: string
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        kvStorageAdaptiveGroups(
          filter: {
            date_geq: $startDate
            date_leq: $endDate
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
