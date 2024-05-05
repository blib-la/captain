/**
 * Enum `KEY` serves as a centralized registry of key identifiers used across different Electron stores.
 * This approach ensures consistency in naming conventions and simplifies the management of various data segments
 * within the application. Each member of the enum represents a distinct data domain or functionality,
 * facilitating a modular and organized storage strategy.
 */
export enum KEY {
	APP = "APP",
	DOWNLOADS = "DOWNLOADS",
	INVENTORY = "INVENTORY",
	KEYS = "KEYS",
	MARKETPLACE = "MARKETPLACE",
	STORE = "STORE",
	USER = "USER",
	WINDOW = "WINDOW",
}

/**
 * Enum `ID` serves as a centralized registry for key identifiers used throughout various Electron handlers and listeners.
 * This approach promotes consistency in naming conventions and eases the management of diverse data segments within the application.
 * Each enum member represents a specific data domain or functionality, supporting a modular and well-organized approach to data handling.
 *
 * Utilizing this enum simplifies referencing these identifiers in the code, reduces the likelihood of errors due to typos,
 * and makes updates more manageable. Additionally, it facilitates the potential transition to using UUIDs for enhanced security in
 * internal (non-exposed) IPC communications, thereby increasing the robustness of message handling.
 */
export enum ID {
	APP = "APP",
	CAPTAIN = "CAPTAIN",
	CAPTAIN_ACTION = "CAPTAIN_ACTION",
	DIRECTORY = "DIRECTORY",
	DOWNLOADS = "DOWNLOADS",
	FILE = "FILE",
	IMAGE = "IMAGE",
	INSTALL = "INSTALL",
	INVENTORY = "INVENTORY",
	KEYS = "KEYS",
	MARKETPLACE = "MARKETPLACE",
	PROMPT = "PROMPT",
	STORE = "STORE",
	THIRD_PARTY_APPS = "THIRD_PARTY_APPS",
	UPDATE = "UPDATE",
	USER = "USER",
	VECTOR_STORE = "VECTOR_STORE",
	WINDOW = "WINDOW",
	STORY = "STORY",
}
