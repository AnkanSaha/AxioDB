/* eslint-disable @typescript-eslint/no-explicit-any */

// Import Libraries
import FolderManager from "../Storage/FolderManager";
import { General } from "../config/Keys/Keys";
import path from "path";
import Insertion from "./Create.operation";
import responseHelper from "../Helper/response.helper";
import {
  SuccessInterface,
  ErrorInterface,
} from "../config/Interfaces/Helper/response.helper.interface";

/**
 * Class representing the AxioDB database.
 */
export default class AxioDB {
  // Properties
  private readonly collectionName: string; // Private Property
  private readonly Schema: object | any; // Private Property
  private isEncrypted: boolean; // Private Property
  #encryptionKey: string; // Private Property
  private readonly clusterName: string; // Private Property
  private readonly currentPATH: string; // Private Property
  private collectionPath: string; // Private Property

  /**
   * Creates an instance of AxioDB.
   * @param {string} collectionName - The name of the collection.
   * @param {object | any} [Schema] - The schema object defining the structure of the collection.
   * @param {boolean} [isEncrypted=false] - Indicates if the collection is encrypted.
   * @param {string} [ClusterName=General.DBMS_Name] - The name of the cluster.
   */
  constructor(
    collectionName: string,
    Schema?: object | any,
    isEncrypted: boolean = false,
    ClusterName: string = General.DBMS_Name,
  ) {
    this.collectionName = collectionName;
    this.Schema = Schema;
    this.isEncrypted = isEncrypted;
    this.#encryptionKey = General.DBMS_Name;
    this.clusterName = ClusterName;
    this.currentPATH = path.resolve(".");
    this.collectionPath = `${this.currentPATH}/${this.clusterName}/${this.collectionName}`;
  }

  // Configure Method

  /**
   * Gets the schema of the collection.
   * @returns {object | any} The schema of the collection.
   */
  public getSchema(): object | any {
    return this.Schema;
  }

  /**
   * Gets the encryption status of the collection.
   * @returns {boolean} The encryption status of the collection.
   */
  public EncryptionStatus(): boolean {
    return this.isEncrypted;
  }

  /**
   * Gets the encryption key of the collection.
   * @returns {string} The encryption key of the collection.
   */
  public getEncryptionKey(): string {
    return this.#encryptionKey;
  }

  /**
   * Sets the encryption key of the collection.
   * @param {string} key - The new encryption key.
   */
  public setEncryptionKey(key: string): void {
    this.#encryptionKey = key;
  }

  /**
   * Sets the encryption status of the collection.
   * @param {boolean} status - The new encryption status.
   */
  public setEncryptionStatus(status: boolean): void {
    this.isEncrypted = status;
  }

  /**
   * Gets the configuration of the collection.
   * @returns {object | any} The configuration of the collection.
   */
  public getConfiguration(): object | any {
    return {
      Schema: this.getSchema(),
      Encryption: {
        Status: this.EncryptionStatus(),
        Key: this.getEncryptionKey(),
      },
    };
  }

  // Public Functions

  /**
   * Inserts data into the collection.
   * @param {object | any} data - The data to be inserted.
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves when the data is inserted.
   */
  public async Insert(
    data: object | any,
  ): Promise<SuccessInterface | ErrorInterface> {
    const response = await new Insertion(this.collectionName, data).Save();
    if (response.status) {
      return new responseHelper().Success({
        Message: "Data Inserted Successfully",
        DocumentID: response.data.DocumentID,
        Data: { ...response.data.Data },
      });
    } else {
      return new responseHelper().Error({
        Message: "Failed to Insert Data",
      });
    }
  }

  // Internal Functions

  /**
   * Creates the root directory for the tree structure.
   *
   * This method initializes the root directory using the cluster name.
   * It utilizes the FolderManager to create the directory asynchronously.
   *
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  public async CreateTreeRoot(): Promise<void> {
    await new FolderManager().CreateDirectory(
      `${this.currentPATH}/${this.clusterName}`,
    );
  }

  /**
   * Creates the collection directory.
   * @returns {Promise<void>} A promise that resolves when the collection directory is created.
   */
  private async createCollection(): Promise<void> {
    if (this.isEncrypted) {
      await new FolderManager().CreateDirectory(
        `${this.currentPATH}/${this.clusterName}/${this.collectionName}/Encrypted`,
      );
      this.collectionPath = `${this.currentPATH}/${this.clusterName}/${this.collectionName}/Encrypted`;
    } else {
      await new FolderManager().CreateDirectory(
        `${this.currentPATH}/${this.clusterName}/${this.collectionName}`,
      );
      this.collectionPath = `${this.currentPATH}/${this.clusterName}/${this.collectionName}`;
    }
  }
}
