/* eslint-disable @typescript-eslint/no-explicit-any */
// import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";

// Import All helpers
import responseHelper from "../../Helper/response.helper";
import Converter from "../../Helper/Converter.helper";
import FileManager from "../../Storage/FileManager";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import InMemoryCache from "../../Caching/cache.operation";
// Import All Utility
import HashmapSearch from "../../utils/HashMapSearch.utils";
import Sorting from "../../utils/SortData.utils";

/**
 * Class representing a read operation.
 */
export default class Reader {
  private readonly collectionName: string;
  private readonly path: string | any;
  private readonly Converter: Converter;
  private readonly baseQuery: object | any;
  private limit: number | undefined;
  private skip: number | undefined;
  private sort: object | any;
  private isEncrypted: boolean;
  private encryptionKey: string | undefined;
  private cryptoInstance?: CryptoHelper;
  private totalCount: boolean;
  private project: object | any;
  private readonly ResponseHelper: responseHelper;
  private AllData: any[];

  /**
   * Creates an instance of Read.
   * @param {string} collectionName - The name of the collection.
   * @param {string} path - The data to be read.
   * @param {object} baseQuery - The base query to be used.
   * @param {boolean} isEncrypted - The encryption status.
   * @param {string} encryptionKey - The encryption key.
   */
  constructor(
    collectionName: string,
    path: string,
    baseQuery: object | any,
    isEncrypted: boolean = false,
    encryptionKey?: string,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.limit = 10;
    this.skip = 0;
    this.isEncrypted = isEncrypted;
    this.sort = {};
    this.project = {};
    this.baseQuery = baseQuery;
    this.Converter = new Converter();
    this.encryptionKey = encryptionKey;
    this.ResponseHelper = new responseHelper();
    this.totalCount = false;
    this.AllData = [];
    if (this.isEncrypted === true) {
      this.cryptoInstance = new CryptoHelper(this.encryptionKey);
    }
  }

  /**
   * Reads the data from a file.
   * @returns {Promise<any>} A promise that resolves with the response of the read operation.
   */
  public async exec(): Promise<SuccessInterface | ErrorInterface> {
    try {
      let SearchedData: any[] = [];
      // At first check if the data is in cache or not
      const responseFromCache = await InMemoryCache.getCache(
        this.Converter.ToString(this.baseQuery),
      );
      if (responseFromCache === true) {
        SearchedData = responseFromCache; // if the data is in cache then use it instead of searching
        // Check if any sort is passed or not
        if (Object.keys(this.sort).length === 0) {
          return await this.ApplySkipAndLimit(SearchedData); // if no sort is passed then return searched data
        }
        const Sorter: Sorting = new Sorting(SearchedData, this.sort);
        const SortedData: any[] = await Sorter.sort(); // Sort the data
        return await this.ApplySkipAndLimit(SortedData); // Apply Skip and Limit & return the data
      } else {
        const ReadResponse = await this.LoadAllBufferRawData();
        if ("data" in ReadResponse) {
          // Check if any query is passed or not
          if (Object.keys(this.baseQuery).length === 0) {
            // Check if any sort is passed or not
            if (Object.keys(this.sort).length === 0) {
              return await this.ApplySkipAndLimit(ReadResponse.data); // Apply Skip and Limit & return the data
            }
            const Sorter: Sorting = new Sorting(ReadResponse.data, this.sort);
            const SortedData: any[] = await Sorter.sort(); // Sort the data
            return await this.ApplySkipAndLimit(SortedData); // Apply Skip and Limit & return the data
          }

          // Search the data from the AllData using HashMapSearch Searcher
          const HashMapSearcher: HashmapSearch = new HashmapSearch(
            ReadResponse.data,
          );
          SearchedData = await HashMapSearcher.find(this.baseQuery);

          await InMemoryCache.setCache(
            this.Converter.ToString(this.baseQuery),
            SearchedData,
          );

          // Check if any sort is passed or not
          if (Object.keys(this.sort).length === 0) {
            return await this.ApplySkipAndLimit(SearchedData); // if no sort is passed then return searched data
          }
          const Sorter: Sorting = new Sorting(SearchedData, this.sort);
          const SortedData: any[] = await Sorter.sort(); // Sort the data
          return await this.ApplySkipAndLimit(SortedData); // Apply Skip and Limit & return the data
        }
      }
      return this.ResponseHelper.Error("Failed to read data");
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  /**
   * set limit to the query
   * @param {number} limit - The limit to be set.
   * @returns {Reader} - An instance of the Reader class.
   */
  public Limit(limit: number): Reader {
    // Check if limit is a number or not
    if (typeof limit !== "number") {
      throw new Error("Limit should be a number");
    }
    this.limit = limit;
    return this;
  }

  /**
   * to be skipped to the query
   * @param {number} skip - The skip to be set.
   * @returns {Reader} - An instance of the Reader class.
   */

  public Skip(skip: number): Reader {
    // Check if skip is a number or not
    if (typeof skip !== "number") {
      throw new Error("Skip should be a number");
    }
    this.skip = skip;
    return this;
  }

  /**
   * to be sorted to the query
   * @param {object} sort - The sort to be set.
   * @returns {Reader} - An instance of the Reader class.
   */
  public Sort(sort: object | any): Reader {
    // check if sort is an object or not
    if (typeof sort !== "object") {
      throw new Error("Sort should be an object");
    }
    this.sort = sort;
    return this;
  }

  /**
   * Sets whether to include the total count of matching documents in the result.
   *
   * @param count - Boolean flag indicating whether to include the total count
   * @returns The Reader instance for method chaining
   */
  public setCount(count: boolean): Reader {
    this.totalCount = count;
    return this;
  }

  public setProject(project: object | any): Reader {
    // check if project is an object or not
    if (typeof project !== "object") {
      throw new Error("Project should be an object");
    }
    this.project = project;
    return this;
  }

  /**
   * Loads all buffer raw data from the specified directory.
   *
   * This method performs the following steps:
   * 1. Checks if the directory is locked.
   * 2. If the directory is not locked, it lists all files in the directory.
   * 3. Reads each file and decrypts the data if encryption is enabled.
   * 4. Stores the decrypted data in the `AllData` array.
   * 5. If the directory is locked, it unlocks the directory, reads the files, and then locks the directory again.
   *
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to a success or error response.
   *
   * @throws {Error} Throws an error if any operation fails.
   */
  private async LoadAllBufferRawData(): Promise<
    SuccessInterface | ErrorInterface
  > {
    try {
      // Check if Directory Locked or not
      const isLocked = await new FolderManager().IsDirectoryLocked(this.path);
      if ("data" in isLocked) {
        // If Directory is not locked
        if (isLocked.data === false) {
          // Read List the data from the file
          const ReadResponse = await new FolderManager().ListDirectory(
            this.path,
          );
          if ("data" in ReadResponse) {
            // Store all files in DataFilesList
            const DataFilesList: string[] = ReadResponse.data;
            // Read all files from the directory
            for (let i = 0; i < DataFilesList.length; i++) {
              const ReadFileResponse: SuccessInterface | ErrorInterface =
                await new FileManager().ReadFile(
                  `${this.path}/${DataFilesList[i]}`,
                );
              // Check if the file is read successfully or not
              if ("data" in ReadFileResponse) {
                if (this.isEncrypted === true && this.cryptoInstance) {
                  // Decrypt the data if crypto is enabled
                  const ContentResponse = await this.cryptoInstance.decrypt(
                    this.Converter.ToObject(ReadFileResponse.data),
                  );
                  // Store all Decrypted Data in AllData
                  this.AllData.push(this.Converter.ToObject(ContentResponse));
                } else {
                  this.AllData.push(
                    this.Converter.ToObject(ReadFileResponse.data),
                  );
                }
              } else {
                return this.ResponseHelper.Error(
                  `Failed to read file: ${DataFilesList[i]}`,
                );
              }
            }
            return this.ResponseHelper.Success(this.AllData);
          }
          return this.ResponseHelper.Error("Failed to read directory");
        } else {
          // if Directory is locked then unlock it
          const unlockResponse = await new FolderManager().UnlockDirectory(
            this.path,
          );
          if ("data" in unlockResponse) {
            // Read List the data from the file
            const ReadResponse: SuccessInterface | ErrorInterface =
              await new FolderManager().ListDirectory(this.path);
            if ("data" in ReadResponse) {
              // Store all files in DataFilesList
              const DataFilesList: string[] = ReadResponse.data;
              // Read all files from the directory
              for (let i = 0; i < DataFilesList.length; i++) {
                const ReadFileResponse: SuccessInterface | ErrorInterface =
                  await new FileManager().ReadFile(
                    `${this.path}/${DataFilesList[i]}`,
                  );
                // Check if the file is read successfully or not
                if ("data" in ReadFileResponse) {
                  if (this.isEncrypted === true && this.cryptoInstance) {
                    // Decrypt the data if crypto is enabled
                    const ContaentResponse = await this.cryptoInstance.decrypt(
                      this.Converter.ToObject(ReadFileResponse.data),
                    );
                    // Store all Decrypted Data in AllData
                    this.AllData.push(
                      this.Converter.ToObject(ContaentResponse),
                    );
                  } else {
                    this.AllData.push(
                      this.Converter.ToObject(ReadFileResponse.data),
                    );
                  }
                } else {
                  return this.ResponseHelper.Error(
                    `Failed to read file: ${DataFilesList[i]}`,
                  );
                }
              }

              // Lock the directory after reading all files
              const lockResponse = await new FolderManager().LockDirectory(
                this.path,
              );
              if ("data" in lockResponse) {
                return this.ResponseHelper.Success(this.AllData);
              } else {
                return this.ResponseHelper.Error(
                  `Failed to lock directory: ${this.path}`,
                );
              }
            }
            return this.ResponseHelper.Error(
              `Failed to read directory: ${this.path}`,
            );
          } else {
            return this.ResponseHelper.Error(
              `Failed to unlock directory: ${this.path}`,
            );
          }
        }
      } else {
        return this.ResponseHelper.Error(isLocked);
      }
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  /**
   * Applies skip and limit to the provided data array.
   *
   * This method checks if both `limit` and `skip` are defined. If they are,
   * it slices the `FinalData` array according to the `skip` and `limit` values
   * and returns the sliced data. If either `limit` or `skip` is not defined,
   * it returns the original `FinalData` array.
   *
   * @param {any[]} FinalData - The array of data to apply skip and limit to.
   * @returns {Promise<SuccessInterface | ErrorInterface>} - A promise that resolves to a success interface containing the sliced data or the original data.
   */
  private async ApplySkipAndLimit(
    FinalData: any[],
  ): Promise<SuccessInterface | ErrorInterface> {
    // Check if limit is passed or not
    if (this.limit !== undefined && this.skip !== undefined) {
      // Apply Skip and Limit
      const limitedAndSkippedData: any[] = FinalData.slice(
        this.skip,
        this.skip + this.limit,
      );

      if (this.totalCount) {
        // Apply Projectd if total count is true
        if (Object.keys(this.project).length !== 0) {
          const projectionresponse = await this.ApplyProjection(
            limitedAndSkippedData,
          );
          if ("data" in projectionresponse) {
            return this.ResponseHelper.Success({
              documents: projectionresponse.data.documents,
              totalDocuments: FinalData.length,
            });
          }
        }
        return this.ResponseHelper.Success({
          documents: limitedAndSkippedData,
          totalDocuments: limitedAndSkippedData.length,
        });
      } else {
        if (Object.keys(this.project).length !== 0) {
          const projectionresponse = await this.ApplyProjection(
            limitedAndSkippedData,
          );
          if ("data" in projectionresponse) {
            return this.ResponseHelper.Success({
              documents: projectionresponse.data.documents,
            });
          }
        }
        return this.ResponseHelper.Success({
          documents: limitedAndSkippedData,
        });
      }
    }
    return this.ResponseHelper.Success({
      documents: FinalData,
    });
  }

  // Apply Projection
  private async ApplyProjection(
    FinalData: any[],
  ): Promise<SuccessInterface | ErrorInterface> {
    // Apply Project
    if (Object.keys(this.project).length !== 0) {
      const projectedData: any[] = FinalData.map((data) => {
        const projectedObject: any = {};
        Object.keys(this.project).forEach((key) => {
          if (key in data) {
            projectedObject[key] = data[key];
          }
        });
        return projectedObject;
      });
      return this.ResponseHelper.Success({
        documents: projectedData,
      });
    }
    return this.ResponseHelper.Success({
      documents: FinalData,
    });
  }
}
