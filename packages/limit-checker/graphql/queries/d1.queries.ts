import { gql } from "graphql-tag";

export const d1ActiveDatabasesQuery = gql`
  query D1ActiveDatabases(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $cursor: string!
    $limit: uint64!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        d1AnalyticsAdaptiveGroups(
          filter: {
            datetimeHour_geq: $startDate
            datetimeHour_leq: $endDate
            databaseId_gt: $cursor
          }
          limit: $limit
          orderBy: [databaseId_ASC]
        ) {
          dimensions {
            databaseId
          }
        }
      }
    }
  }
`;

export const d1OperationsByIdsQuery = gql`
  query D1OperationsById(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $resourceIds: [string!]!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        d1AnalyticsAdaptiveGroups(
          filter: {
            datetimeHour_geq: $startDate
            datetimeHour_leq: $endDate
            databaseId_in: $resourceIds
          }
          limit: 10000
          orderBy: [databaseId_ASC]
        ) {
          dimensions {
            databaseId
          }
          sum {
            queryBatchResponseBytes
            readQueries
            rowsRead
            rowsWritten
            writeQueries
          }
        }
      }
    }
  }
`;

export const d1OperationsByCursorQuery = gql`
  query D1OperationsByCursor(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $cursor: string!
    $limit: uint64!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        d1AnalyticsAdaptiveGroups(
          filter: {
            datetimeHour_geq: $startDate
            datetimeHour_leq: $endDate
            databaseId_gt: $cursor
          }
          limit: $limit
          orderBy: [databaseId_ASC]
        ) {
          dimensions {
            databaseId
          }
          sum {
            queryBatchResponseBytes
            readQueries
            rowsRead
            rowsWritten
            writeQueries
          }
        }
      }
    }
  }
`;

export const d1StorageByIdsQuery = gql`
  query D1StorageById(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $resourceIds: [string!]!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        d1StorageAdaptiveGroups(
          filter: {
            datetimeHour_geq: $startDate
            datetimeHour_leq: $endDate
            databaseId_in: $resourceIds
          }
          limit: 10000
          orderBy: [databaseId_ASC]
        ) {
          dimensions {
            databaseId
          }
          max {
            databaseSizeBytes
          }
        }
      }
    }
  }
`;

export const d1StorageByCursorQuery = gql`
  query D1StorageByCursor(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $limit: uint64!
    $cursor: string
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        d1StorageAdaptiveGroups(
          filter: {
            datetimeHour_geq: $startDate
            datetimeHour_leq: $endDate
            databaseId_gt: $cursor
          }
          limit: $limit
          orderBy: [databaseId_ASC]
        ) {
          dimensions {
            databaseId
          }
          max {
            databaseSizeBytes
          }
        }
      }
    }
  }
`;
