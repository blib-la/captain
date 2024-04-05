import type { Schemas as QdrantSchemas } from "@qdrant/js-client-rest";
import type { Except } from "type-fest";
/**
 * Defines the structure of a document stored in the vector store, which can represent actions, settings, or any other type of data that needs to be indexed and searchable.
 */
export type VectorStoreDocument = {
	/**
	 * The unique identifier for the document, as set by the database or vector store. This is the primary key used to uniquely identify each document.
	 */
	id?: number | string;

	/**
	 * The main content of the document. This is what will be used for searching and indexing purposes.
	 */
	content: string;

	/**
	 * Additional metadata associated with the document.
	 */
	payload: {
		/**
		 * A unique identifier within the payload, which can be an app ID or a function name.
		 * It serves to identify the app or a specific function within the app, offering a means to reference or invoke it.
		 */
		id: string;

		/**
		 * The language of the document's content. Helps in categorizing documents by language for localization purposes.
		 */
		language: string;

		/**
		 * An optional action associated with the document. This could be an instruction to focus an element, call a function, or perform any other predefined action.
		 */
		action?: string;

		/**
		 * The type of entry that is stored, e.g. app, image, audio.
		 */
		type: string;

		/**
		 * An optional URL or path to an icon that represents the document or its action visually. Used in UI elements to enhance user experience.
		 */
		icon?: string;
		/**
		 * An optional color for the background of the icon.
		 */
		iconColor?: string;

		/**
		 * An optional brief description of the document or its action. This can be used in UI elements to provide users with more context.
		 */
		description?: string;

		/**
		 * Optional parameters to be passed if the action is a function call. The function to call is determined by the `payload.id` property.
		 * For example, if `action` is "function" and `payload.id` is "userStore.set", then `parameters` could specify the details of the function call.
		 */
		parameters?: Record<string, unknown>;

		/**
		 * The label or title of the document. Used in search results or UI elements to display a human-readable name for the document.
		 */
		label: string;

		/**
		 * The absolute path to the file.
		 */
		filePath?: string;
	};
};

/**
 * Represents a response from the vector store, extending the information contained within VectorStoreDocument,
 * excluding the 'content' property, and including a 'score' to indicate relevance.
 */
export type VectorStoreResponse = Except<VectorStoreDocument, "content"> & {
	/**
	 * A numerical score indicating the relevance of the document to a search query or action request.
	 * Higher scores indicate greater relevance. The scoring mechanism is determined by the vector store's search algorithm.
	 */
	score: number;
};

/**
 * Defines the options that can be used to customize search behavior in the vector store.
 *
 * This configuration allows clients to set criteria such as minimum score thresholds,
 * which serve to filter search results based on relevance scoring. The options can be
 * expanded to include additional search parameters as needed.
 */
export type SearchOptions = Partial<QdrantSchemas["SearchRequest"]>;

/**
 * Defines the options that can be used to customize scroll behavior in the vector store.
 *
 * This configuration allows clients to set criteria such as ordering,
 * which serve to sort results. The options can be expanded to include additional search parameters
 * as needed.
 */
export type ScrollOptions = Partial<QdrantSchemas["ScrollRequest"]>;
