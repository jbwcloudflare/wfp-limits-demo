import { gql } from "graphql-tag";

export const r2ActiveBucketsQuery = gql`
  query R2ActiveBuckets(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $cursor: string!
    $limit: uint64!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        r2OperationsAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            bucketName_gt: $cursor
          }
          limit: $limit
          orderBy: [bucketName_ASC]
        ) {
          dimensions {
            bucketName
          }
        }
      }
    }
  }
`;

export const r2OperationsByIdsQuery = gql`
  query R2OperationsById(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $resourceIds: [string!]!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        r2OperationsAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            bucketName_in: $resourceIds
          }
          limit: 10000
          orderBy: [bucketName_ASC]
        ) {
          dimensions {
            bucketName
          }
          sum {
            requests
            responseBytes
            responseObjectSize
          }
        }
      }
    }
  }
`;

export const r2OperationsByCursorQuery = gql`
  query R2OperationsByCursor(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $cursor: string!
    $limit: uint64!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        r2OperationsAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            bucketName_gt: $cursor
          }
          limit: $limit
          orderBy: [bucketName_ASC]
        ) {
          dimensions {
            bucketName
          }
          sum {
            requests
            responseBytes
            responseObjectSize
          }
        }
      }
    }
  }
`;

export const r2StorageByIdsQuery = gql`
  query R2StorageById(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $resourceIds: [string!]!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        r2StorageAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            bucketName_in: $resourceIds
          }
          limit: 10000
          orderBy: [bucketName_ASC]
        ) {
          dimensions {
            bucketName
          }
          max {
            objectCount
            uploadCount
            payloadSize
            metadataSize
          }
        }
      }
    }
  }
`;

export const r2StorageByCursorQuery = gql`
  query R2StorageByCursor(
    $accountTag: string!
    $startDate: Time!
    $endDate: Time!
    $limit: uint64!
    $cursor: string
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        r2StorageAdaptiveGroups(
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            bucketName_gt: $cursor
          }
          limit: $limit
          orderBy: [bucketName_ASC]
        ) {
          dimensions {
            bucketName
          }
          max {
            objectCount
            uploadCount
            payloadSize
            metadataSize
          }
        }
      }
    }
  }
`;
