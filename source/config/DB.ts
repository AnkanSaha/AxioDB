// Import All Required Sub Modules
import { SchemaTypes } from "../Models/DataTypes.models";
import schemaValidate from "../Models/validator.models";
import FileManager from "../Storage/FileManager";
import FolderManager from "../Storage/FolderManager";
import Configure from "../Operation/Indexation.operation";

// Web Server Configuration
import WebServer from "../Web/Fastify";
WebServer();

// Export Specific Modules
export { SchemaTypes, schemaValidate, FileManager, FolderManager, Configure };

// Export With All Sub Modules
export default {
  SchemaTypes,
  schemaValidate,
  FileManager,
  Configure,
  FolderManager,
};
