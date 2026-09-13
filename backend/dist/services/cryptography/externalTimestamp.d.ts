export interface ExternalTimestampToken {
    schema: "veritasai.external_tsa.v1";
    authority: string;
    tsaSerial: string;
    anchoredHash: string;
    externalTimestamp: string;
    externalBlockHeight: number;
    blockHash: string;
    tsaSignature: string;
}
export declare function anchorToExternalAuthority(targetHash: string): ExternalTimestampToken;
export declare function verifyExternalTimestamp(token: ExternalTimestampToken, expectedHash: string): {
    valid: boolean;
    error?: string;
};
