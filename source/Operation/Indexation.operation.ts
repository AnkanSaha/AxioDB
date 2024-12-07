/* eslint-disable @typescript-eslint/no-explicit-any */

// Import Libraries
import { FolderManager } from "../config/DB";
import { General } from "../config/Keys/Keys";
import path from "path";

export default class Configure {
  // Properties
  private readonly Schema: object | any; // Private Property
  private isEncrypted: boolean; // Private Property
  #encryptionKey: string; // Private Property
  private readonly clusterName: string; // Private Property
  private readonly currentPATH: string; // Private Property

  constructor(
    Schema: object | any,
    isEncrypted = false,
    ClusterName: string = General.DBMS_Name,
  ) {
    this.Schema = Schema;
    this.isEncrypted = isEncrypted;
    this.#encryptionKey = General.DBMS_Name;
    this.clusterName = ClusterName;
    this.currentPATH = path.resolve(".");
    this.CreateTreeRoot(); // Create the root directory for the tree structure.
  }

  // Configure Method
  public getSchema(): object | any {
    return this.Schema;
  }

  public EncryptionStatus(): boolean {
    return this.isEncrypted;
  }

  public getEncryptionKey(): string {
    return this.#encryptionKey;
  }

  public setEncryptionKey(key: string): void {
    this.#encryptionKey = key;
  }

  public setEncryptionStatus(status: boolean): void {
    this.isEncrypted = status;
  }

  public getConfiguration(): object | any {
    return {
      Schema: this.getSchema(),
      Encryption: {
        Status: this.EncryptionStatus(),
        Key: this.getEncryptionKey(),
      },
    };
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
  private async CreateTreeRoot(): Promise<void> {
    await new FolderManager().CreateDirectory(
      `${this.currentPATH}/${this.clusterName}`,
    );
  }
}
