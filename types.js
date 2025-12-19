/**
 * @typedef {'ID card' | 'DIRE' | 'Passport' | 'Bank Doc'} DocumentType
 */

/**
 * @typedef {'normal' | 'lost' | 'found'} DocumentStatus
 */

/**
 * @typedef {'free' | 'premium'} UserPlan
 */

/**
 * @typedef {Object} Location
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} address - Human readable address
 */

/**
 * @typedef {Object} Document
 * @property {string} id - UUID
 * @property {string} user_id - UUID of the owner
 * @property {string} title - Document title
 * @property {DocumentType} type - Type of document
 * @property {DocumentStatus} status - Current status
 * @property {Location} location - Where the document was lost/found
 * @property {string} file_url - URL to the document file/image
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - UUID (same as auth.users.id)
 * @property {UserPlan} plan - User's subscription plan
 * @property {number} document_count - Number of documents
 * @property {string} created_at - ISO timestamp
 * @property {string} phone_number - User's phone number
 * @property {string} country - User's country
 */

/**
 * @typedef {Object} Chat
 * @property {string} id - UUID
 * @property {string} document_id - UUID of related document
 * @property {string} sender_id - UUID of message sender
 * @property {string} receiver_id - UUID of message receiver
 * @property {string} message - Chat message content
 * @property {string} created_at - ISO timestamp
 */

const DOCUMENT_TYPES = {
    ID_CARD: 'ID card',
    DIRE: 'DIRE',
    PASSPORT: 'Passport',
    BANK_DOC: 'Bank Doc'
};

const DOCUMENT_STATUS = {
    NORMAL: 'normal',
    LOST: 'lost',
    FOUND: 'found'
};

const USER_PLANS = {
    FREE: 'free',
    PREMIUM: 'premium'
};

if (typeof window !== 'undefined') {
    window.DOCUMENT_TYPES = DOCUMENT_TYPES;
    window.DOCUMENT_STATUS = DOCUMENT_STATUS;
    window.USER_PLANS = USER_PLANS;
}