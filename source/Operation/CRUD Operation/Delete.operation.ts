/* eslint-disable @typescript-eslint/no-explicit-any */

import { ErrorInterface, SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import Converter from "../../Helper/Converter.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";
import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";

// Import All Utility
import HashmapSearch from "../../utils/HashMapSearch.utils";
import Sorting from "../../utils/SortData.utils";

export default class DeleteOperation {
    // Properties
    protected readonly collectionName: string;
    private readonly baseQuery: object | any;
    private readonly path: string;
    private readonly isEncrypted: boolean;
    private readonly encryptionKey: string | undefined;
    private readonly ResponseHelper: ResponseHelper;
    private readonly cryptoInstance?: CryptoHelper;
    private readonly Converter: Converter;
    private allDataWithFileName: any[] = [];
    private sort: object | any;

    constructor(collectionName: string, path: string, baseQuery: object | any, isEncrypted: boolean = false, encryptionKey?: string,) {
        this.collectionName = collectionName;
        this.path = path;
        this.baseQuery = baseQuery;
        this.isEncrypted = isEncrypted;
        this.encryptionKey = encryptionKey;
        this.sort = {};
        this.ResponseHelper = new ResponseHelper();
        this.Converter = new Converter();
        if (this.isEncrypted && this.encryptionKey) {
            this.cryptoInstance = new CryptoHelper(this.encryptionKey);
        }
        this.allDataWithFileName = []; // To store all data with file name
    }

    // Methods
    public async deleteOne() {
        const response = await this.LoadAllBufferRawData();
        if ("data" in response) {
            const SearchedData = await new HashmapSearch(response.data).find(this.baseQuery, "data");
            if (SearchedData.length === 0) {
                return this.ResponseHelper.Error("No data found with the specified query");
            }

            let selectedFirstData = SearchedData[0]; // Select the first data
            let fileName: string = selectedFirstData?.fileName; // Get the file name

            // Sort the data if sort is provided then select the first data for deletion
            if (Object.keys(this.sort).length === 0) {
                selectedFirstData = SearchedData[0]; // Select the first data
                fileName = selectedFirstData?.fileName; // Get the file name
            } else {
                const Sorter: Sorting = new Sorting(SearchedData, this.sort);
                const SortedData: any[] = await Sorter.sort("data"); // Sort the data
                selectedFirstData = SortedData[0]; // Select the first data
                fileName = selectedFirstData?.fileName; // Get the file name
            }

            // Delete the file
            const deleteResponse = await this.deleteFile(fileName);
            if ("data" in deleteResponse) {
                return this.ResponseHelper.Success({
                    message: "Data deleted successfully",
                    deleteData: selectedFirstData?.data,
                });
            }
            else {
                return this.ResponseHelper.Error("Failed to delete data");
            }
        }
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
                                    this.allDataWithFileName.push({
                                        fileName: DataFilesList[i],
                                        data: this.Converter.ToObject(ContentResponse),
                                    });
                                } else {
                                    this.allDataWithFileName.push(
                                        {
                                            fileName: DataFilesList[i],
                                            data: this.Converter.ToObject(ReadFileResponse.data),
                                        }
                                    );
                                }
                            } else {
                                return this.ResponseHelper.Error(
                                    `Failed to read file: ${DataFilesList[i]}`,
                                );
                            }
                        }
                        return this.ResponseHelper.Success(this.allDataWithFileName);
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
                                        this.allDataWithFileName.push(
                                            {
                                                fileName: DataFilesList[i],
                                                data: this.Converter.ToObject(ContaentResponse),
                                            }
                                        );
                                    } else {
                                        this.allDataWithFileName.push(
                                            {
                                                fileName: DataFilesList[i],
                                                data: this.Converter.ToObject(ReadFileResponse.data),
                                            }
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
                                return this.ResponseHelper.Success(this.allDataWithFileName);
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
     * Deletes a file from the specified path.
     * 
     * This method checks if the directory is locked before attempting to delete the file.
     * If the directory is locked, it tries to unlock it, delete the file, and then lock it again.
     * 
     * @param fileName - The name of the file to be deleted
     * @returns A response object indicating success or failure
     *          Success response: { status: true, message: "File deleted successfully" }
     *          Error response: { status: false, message: <error message> }
     * @private
     */
    private async deleteFile(fileName: string) {
        // Check if Directory Locked or not
        const isLocked = await new FolderManager().IsDirectoryLocked(this.path);
        if ("data" in isLocked) {
            // If Directory is not locked
            if (isLocked.data === false) {
                const deleteResponse = await new FileManager().DeleteFile(
                    `${this.path}/${fileName}`,
                );
                if ("data" in deleteResponse) {
                    return this.ResponseHelper.Success("File deleted successfully");
                }
                else {
                    return this.ResponseHelper.Error("Failed to delete file");
                }
            }
            else {
                const unlockResponse = await new FolderManager().UnlockDirectory(
                    this.path,
                );
                if ("data" in unlockResponse) {
                    const deleteResponse = await new FileManager().DeleteFile(
                        `${this.path}/${fileName}`,
                    );
                    if ("data" in deleteResponse) {
                        const lockResponse = await new FolderManager().LockDirectory(
                            this.path,
                        );
                        if ("data" in lockResponse) {
                            return this.ResponseHelper.Success("File deleted successfully");
                        }
                        else {
                            return this.ResponseHelper.Error("Failed to lock directory");
                        }
                    }
                    else {
                        return this.ResponseHelper.Error("Failed to delete file");
                    }
                }
                else {
                    return this.ResponseHelper.Error("Failed to unlock directory");
                }
            }
        }
        else {
            return this.ResponseHelper.Error("Failed to delete file");
        }
    }

    /**
 * to be sorted to the query
 * @param {object} sort - The sort to be set.
 * @returns {DeleteOperation} - An instance of the DeleteOperation class.
 */
    public Sort(sort: object | any): DeleteOperation {
        this.sort = sort;
        return this;
    }
}