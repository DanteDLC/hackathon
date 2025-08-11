import { APIGatewayProxyEvent } from 'aws-lambda';

export type LambdaResult = {
    body: string;
    status: number;
};

export type Admin = {
    username: string;
};

export type Account = {
    username: string;
    email: string;
    name: string;
    aha_email: string;
    aha_api_key: string;
    testrail_username: string;
    testrail_api_key: string;
    openai_prompt?: string;
    options?: Options[];
};

export interface Options {
    favorites: Favorites[];
}

export interface Favorites {
    productIds?: Product[];
    projectIds?: Project[];
}

export interface Profile {
    email: string;
    username: string;
    name: string;
    aha_email: string;
    aha_api_key: string;
    testrail_username: string;
    testrail_api_key: string;
    prompt?: string;
    version?: string;
    openai_api_key?: string;
}

export interface InitializeAcc {
    admin: boolean;
    profile: null | Profile;
}

export type PromptCreatedBy = {
    name: string;
    email: string;
};

export type PromptVersionControl = {
    version: string;
    content: string;
    created_by: PromptCreatedBy;
    is_personal?: boolean;
    date: string;
    raw_date: string;
    nickname?: string;
};

export interface DropdownOptions {
    label: string;
    value: string;
}

export interface Creds {
    email: string;
    aha_api_key: string;
    testrail_username: string;
    testrail_api_key: string;
    name?: string;
}

export interface OpenAICredDisplay {
    email: string;
    version: string;
    prompt: string;
    openai_api_key: string;
}

export type AIFeatureSettings = {
    model?: string | undefined;
    bedRockModel?: string | undefined;
    region?: string | undefined;
    temperature?: number | undefined;
    anthropicVersion?: string | undefined;
    maxTokens?: number | undefined;
    topP?: number | undefined;
    topK?: number | undefined;
};

export type AIFeatureKeys =
    | 'generator-testcase'
    | 'generator-imageanalyzer'
    | 'generator-ahaticket'
    | 'chatbot'
    | 'analyzer';

export type OpenAICred = {
    id?: number;
    openai_key1?: string;
    openai_key2?: string;
    openai_prompt?: string;
    version?: string;
    openai_endpoint?: string;
    features?: {
        [key in AIFeatureKeys]?: AIFeatureSettings;
    };
};

export interface GPTClassification {
    reference_number: string;
    confidence_score?: number;
    explanation?: string;
    production_bug?: 'Yes' | 'No';
    error?: string;
}

export interface Assigned {
    comments?: string[];
    tags?: (string | { name: string })[];
    created_at?: string;
    description?: string;
    record_type: string;
    id: number | string;
    name: string;
    status: string;
    reference_num: string;
    url: string;
    workflow_status?: {
        id: string;
        name: string;
        position: number;
        complete: boolean;
        color: string;
    };
    due_date?: string;
    current_task_user?: {
        id: string;
        status: string;
    };
    gptClassification?: GPTClassification;
}

export interface AssignedRecordResponse {
    comments?: string[];
    tags?: (string | { name: string })[];
    created_at?: string;
    reference_num: string;
    name: string;
    status: string;
    record_type: string;
    id: number;
    workflow_status?: {
        id: string;
        name: string;
        position: number;
        complete: boolean;
        color: string;
    };
    due_date?: string;
    current_task_user?: {
        id: string;
        status: string;
    };
    description?: string;
    priority?: string;
    url: string;
}

export interface AssignedRecordsResponse {
    assigned: AssignedRecordResponse[];
}

//   RETURN TEMPLATES
export interface Project {
    id: number;
    name: string;
}

export interface Section {
    id: number;
    suite_id: number;
    name: string;
    display_order: number;
    parent_id?: number | null;
}

export interface ReleaseRoot {
    releases: Release[];
    pagination: ReleasePagination;
}

export interface Release {
    id: string;
    reference_num: string;
    name: string;
    parking_lot: boolean;
    created_at: string;
    product_id: string;
    url: string;
    resource: string;
    owner: Owner;
    project: ReleaseProject;
}

export interface Owner {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface ReleaseProject {
    id: string;
    reference_prefix: string;
    name: string;
    product_line: boolean;
    created_at: string;
    workspace_type: string;
    url: string;
}

export interface ReleasePagination {
    total_records: number;
    total_pages: number;
    current_page: number;
}

export interface Product {
    id: string;
    reference_prefix: string;
    name: string;
}

//MODIFY IF NEEDED
export interface Prompt {
    reference_prefix: string;
    name: string;
}

export interface JsonProj {
    projects: Project[];
}

export interface JsonSection {
    sections: Section[];
}

export interface JsonProd {
    products: Product[];
    pagination: ReleasePagination;
}

export interface JsonFeatList {
    features: FeatItem[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagination: any;
}

export interface JsonFeatReq {
    requirements: FeatDescripJson[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagination: any;
}

export interface JsonFeatReqSolo {
    feature: FeatDescripJson;
}

export interface FeatItem {
    reference_num: string;
    name: string;
}

export interface FeatDescripJson {
    id: string;
    reference_num: string;
    name: string;
    description: {
        body: string;
    };
}

export interface FeatDescrip {
    id: string;
    reference_num: string;
    name: string;
    description_body: string;
    context?: string;
}

export interface CustomStepProp {
    content: string;
    expected: string;
}

export interface TestCaseProp {
    title: string;
    custom_preconds: string;
    custom_steps_separated: CustomStepProp[];
}

export interface TestCases {
    name: string;
    GeneratedTestCase: TestCaseProp[];
    reference_num: string;
}

export interface FetchedIds {
    cases: { suite_id: string; section_id: string }[];
}

export interface FetchedSections {
    sections: {
        id: string;
        name: string;
        suite_id: string;
    }[];
}

export interface GeneratedTC {
    name: string;
    GeneratedTestCase: TestCaseProp[];
}

export interface TestRail {
    GTC: GeneratedTC[];
    project_id: string;
}

export interface SectionData {
    id: number;
}

export interface CaseData {
    id: number;
}

export interface Link {
    title: string;
    link: string;
}

export interface LinkObject {
    name: string;
    Test_Rail: Link[];
}

export interface AhaFeature {
    name: string;
    workflow_kind: 'New' | 'Research' | 'Bug fix' | 'Enhancement';
    workflow_status?: string;
    assigned_to_user?: string;
    tags?: string[];
    initial_estimate_text?: string;
    detailed_estimate_text?: string;
    remaining_estimate_text?: string;
    start_date?: string;
    due_date?: string;
    description: string;
    // markup_description: string;
}

export interface AhaRoot {
    user: AhaUser;
}

export interface AhaUser {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
    accessed_at: string;
    product_roles: ProductRole[];
    preferences: {
        current_product_id: number;
    };
    accounts: AhaAccount[];
}

export interface ProductRole {
    role: number;
    role_description: string;
    product_id: string;
    product_name: string;
}

export interface AhaAccount {
    account: {
        name: string;
        domain: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logo: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alt_logo: any;
        enabled: boolean;
    };
}

export interface TestRailRoot {
    id: number;
    email: string;
    email_notifications: boolean;
    is_active: boolean;
    is_admin: boolean;
    name: string;
    role_id: number;
    role: string;
    group_ids: number[];
    mfa_required: boolean;
}

export interface GenerationHistory {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    previous_results: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instructions: any;
    id: string;
    username: string;
    raw_date: string;
    prompt: string | undefined;
    completion_status: string;
    completion_result: string | undefined;
    requirements: string;
    timestamp: number;
}
export interface GenerationHistoryVersion {
    id: string;
    generation_id: string;
    username: string;
    prompt: string | undefined;
    raw_date: string;
    completion_status: string;
    completion_result: string | undefined;
    timestamp: number;
    generation_version: number;
}

export interface GeneratedHistory {
    _id: string;
    id: string;
    username: string;
    prompt: string;
    completion_result: string; //TestCases[] Model Stringified
    completion_status: string;
    requirements: string; //FeatDescrip[] Model Stringified
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instructions: any;
    regenerate: boolean;
    raw_date: string;
    timestamp: number;
    generation_number: number;
}

export interface PushHistory {
    _id: string;
    id: string;
    generate_id: string;
    project_id: string;
    username: string;
    raw_date: string;
    push_result: string;
    test_cases: string;
    push_status: string;
    timestamp: number;
}

export interface GPTHistory {
    id: string;
    timestamp: number;
    connection_id: string;
    gpt_result: string;
    prompt: string;
    raw_date: string;
    user: string;
    fileName?: string | null;
    processedFilePrompt?: string;
}
export interface FileInput {
    type: string;
    source: {
        type: string;
        media_type: string;
        data: string;
    };
}
export interface TextInput {
    type: string;
    text: string;
}
export interface GPTMessage {
    content: (FileInput | TextInput)[];
    role: 'assistant' | 'user';
}

export interface ChatMessage {
    message: string;
}

export interface ChatResponse {
    id: string;
    message: string;
    date: string;
}

export interface Conversation {
    id: string;
    prompt: string;
    result: string;
    raw_date: string;
    timestamp: number;
    fileName?: string | null;
}

export interface ChatHistory {
    id: string;
    user: string;
    title: string;
    messages: Conversation[];
    last_modified: string;
    timestamp: number;
}

export interface AIUsage {
    id: string;
    ref_id: string;
    username: string;
    source: string;
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    raw_date: string;
    timestamp: number;
}

export interface GenerateBody {
    email: string;
    history_id?: string;
    requirements: FeatDescrip[];
    selectedPrompt?: string;
}

export interface RevisionHistory {
    generations: Generation[];
}

export interface Generation {
    generationNumber: number;
    testCases: TestCases[];
}

export interface LibraryPromptVersion {
    version: string;
    prompt: string;
    gpt_result: string;
    timestamp: string;
}

export interface Comments {
    email: string;
    comment: string;
}

export interface Votes {
    upvote: string[];
    downvote: string[];
}

export interface LibraryPrompt {
    _id?: string;
    id: string;
    name: string;
    author: string;
    version: LibraryPromptVersion;
    comments?: Comments[] | null;
    votes?: Votes;
}

export interface UserPromptVersion {
    version: string;
    updatedBy?: string;
    prompt: string;
    gpt_result: string;
    timestamp: string;
}

export interface UserSavedPrompt {
    id: string;
    name: string;
    author: string;
    username: string;
    version: UserPromptVersion[];
    processedFilePrompt?: string;
}

export interface SelectedUserPrompt {
    id: string;
    name: string;
    author: string;
    username: string;
    versions: string[];
    version: UserPromptVersion;
}

export interface TokenUsage {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    inputCost: number;
    outputCost: number;
    blendedCost: number;
}

export interface UserTokenUsage {
    username: string;
    totalTokens: number;
    timestamp: number;
}

export interface promptAnalyzer {
    id: string;
    name: string;
    prompt: string;
    author: string;
}

export type AuthStatus = 'AUTHORIZED' | 'HAS_TOKEN' | 'NEW_USER';

export interface CognitoTokenResponse {
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export interface Identity {
    dateCreated: string;
    userId: string;
    providerName: string;
    providerType: string;
    issuer: string;
    primary: string;
}

export interface CognitoIDToken {
    'custom:adGroup': string;
    at_hash: string;
    sub: string;
    'cognito:groups': string[];
    email_verified: boolean;
    iss: string;
    'cognito:username': string;
    given_name: string;
    nonce: string;
    origin_jti: string;
    aud: string;
    identities: Identity[];
    token_use: string;
    auth_time: number;
    'custom:adObjectId': string;
    exp: number;
    iat: number;
    family_name: string;
    jti: string;
    email: string;
}

export interface CognitoAccessToken {
    'custom:adGroup': string;
    sub: string;
    'cognito:groups': string[];
    'custom:clientId': string;
    'custom:principalType': string;
    iss: string;
    given_name: string;
    version: number;
    client_id: string;
    origin_jti: string;
    'custom:idmeUuid': string;
    token_use: string;
    scope: string;
    auth_time: number;
    'custom:adObjectId': string;
    exp: number;
    family_name: string;
    iat: number;
    jti: string;
    username: string;
}

export interface AuthorizerContext {
    email: string;
    username: string;
    cognito_groups: string[];
    azure_groups: string[];
}

export interface AuthenticatedAPIGatewayProxyEvent
    extends Omit<APIGatewayProxyEvent, 'requestContext'> {
    requestContext: APIGatewayProxyEvent['requestContext'] & {
        authorizer: AuthorizerContext;
    };
}

export interface TicketInput {
    reference_number: string;
    title: string;
    description: string;
    tags: (string | { name: string })[];
    comments: unknown[];
}

export interface TicketClassificationResponse {
    classifications: TicketClassification[];
    promptTokens: number;
}

export interface TicketClassification {
    reference_number: string;
    confidence_score: number;
    explanation: string;
    production_bug: 'Yes' | 'No';
    error?: string;
}

export interface AhaTicketGeneratorPrompt {
    id: string;
    name: string;
    prompt: string;
    author: string;
}

export type UserClassification =
    | 'none'
    | 'no-api'
    | 'only-aha'
    | 'only-testrail'
    | 'both';

export interface WebhookData {
    audit: {
        auditable_url: string;
        audit_action: string;
    };
}

export interface CreatedFeatureRoot {
    feature: CreatedFeature;
}

export interface CreatedFeature {
    id: string;
    name: string;
    reference_num: string;
    initiative_reference_num: any;
    release_reference_num: string;
    epic_reference_num: any;
    position: number;
    score: number;
    created_at: string;
    updated_at: string;
    start_date: any;
    due_date: any;
    product_id: string;
    progress: number;
    progress_source: string;
    status_changed_on: string;
    created_by_user: {
        id: string;
        name: string;
        email: string;
        created_at: string;
        updated_at: string;
    };
    workflow_kind: {
        id: string;
        name: string;
    };
    workflow_status: {
        id: string;
        name: string;
        position: number;
        complete: boolean;
        color: string;
    };
    project: {
        id: string;
        reference_prefix: string;
        name: string;
        product_line: boolean;
        created_at: string;
        workspace_type: string;
    };
    original_estimate: any;
    remaining_estimate: any;
    initial_estimate: any;
    work_done: any;
    work_units: number;
    use_requirements_estimates: boolean;
    description: {
        id: string;
        body: string;
        created_at: string;
        attachments: any[];
    };
    attachments: any[];
    integration_fields: any[];
    url: string;
    resource: string;
    release: Release;
    assigned_to_user: any;
    requirements: {
        name: string;
        description?: string;
        assigned_to_user?: string;
        start_date?: string;
        due_date?: string;
        tags?: string[];
    }[];
    goals: any[];
    comments_count: number;
    score_facts: any[];
    tags: any[];
    full_tags: any[];
    custom_fields: any[];
    time_tracking_events: any[];
    feature_links: any[];
    workflow_status_times: {
        status_id: string;
        status_name: string;
        started_at: string;
        ended_at: any;
    }[];
    feature_only_original_estimate: any;
    feature_only_remaining_estimate: any;
    feature_only_work_done: any;
}

export interface AnalyzerClassification {
    reference_number: string;
    confidence_score: number;
    explanation: string;
    production_bug: string;
}
export interface AnalyzerWebhookReport {
    report_created: string;
    report_updated: string;
    ticket: {
        reference_num: string;
        name: string;
        description: {
            id: string;
            body: string;
            created_at: string;
            attachments: any[];
        };
        classification: AnalyzerClassification;
        created_at: string;
        updated_at: string;
        new_ticket: boolean;
        tagged?: boolean;
        model: string;
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface SelectedTicketEntry {
    week: string;
    ticket: AnalyzerPodReport['tickets'][0];
}

export interface AnalyzerMappings {
    username: string;
    pods: {
        id: string;
        name: string;
        reference_num: string;
    }[];
}

export interface AnalyzerPodReport {
    week: string;
    duration: string;
    evaluator: string;
    pod: {
        id: string;
        name: string;
        reference_num: string;
    };
    evaluated: boolean;
    evaluatedAt?: string;
    tickets: AnalyzerWebhookReport[];
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    createdAt: string;
    updatedAt: string;
}

export interface PromptFormData {
    content: string;
    nickname: string;
}

export interface PromptCrudProps {
    onPromptSelect?: (prompt: PromptVersionControl) => void;
}

export interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPrompt?: PromptVersionControl | null;
    onSuccess?: () => void;
}

export interface CreatePromptModalProps
    extends Omit<PromptModalProps, 'selectedPrompt'> {
    getNextVersion: () => string;
}

export interface EditPromptModalProps extends PromptModalProps {
    getNextVersion: () => string;
}

export interface PromptSelectorProps {
    prompts: PromptVersionControl[];
    selectedPrompt: PromptVersionControl | null;
    loadingPrompts: boolean;
    onPromptSelect: (prompt: PromptVersionControl) => void;
    onCreatePrompt: () => void;
    onViewPrompt: (prompt: PromptVersionControl) => void;
    onEditPrompt: (prompt: PromptVersionControl) => void;
    onDeletePrompt: (prompt: PromptVersionControl) => void;
    onRefetchPrompts?: () => Promise<void>;
}