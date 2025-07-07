// IPFS helper functions
import { CID } from 'multiformats/cid';

// Map to store original CIDs from Pinata before conversion
const cidMapping = new Map();

// Load existing mappings from localStorage on module init
try {
    const storedMappings = JSON.parse(localStorage.getItem('cidMappings') || '{}');
    Object.entries(storedMappings).forEach(([converted, original]) => {
        cidMapping.set(converted, original);
    });
    console.log(`Loaded ${cidMapping.size} CID mappings from localStorage`);
} catch (err) {
    console.error('Error loading CID mappings from localStorage:', err);
}

// Store the original CID and the converted one
export const storeCidMapping = (originalCid, convertedCid) => {
    cidMapping.set(convertedCid, originalCid);

    // Also store in localStorage for persistence
    try {
        const existingMappings = JSON.parse(localStorage.getItem('cidMappings') || '{}');
        existingMappings[convertedCid] = originalCid;
        localStorage.setItem('cidMappings', JSON.stringify(existingMappings));
        console.log(`Stored mapping: ${convertedCid} → ${originalCid}`);
    } catch (err) {
        console.error('Error storing CID mapping in localStorage:', err);
    }
};

// Get original CID from the converted one
export const getOriginalCid = (convertedCid) => {
    // First check memory map
    if (cidMapping.has(convertedCid)) {
        return cidMapping.get(convertedCid);
    }

    // Then check localStorage
    try {
        const existingMappings = JSON.parse(localStorage.getItem('cidMappings') || '{}');
        return existingMappings[convertedCid] || convertedCid;
    } catch (err) {
        console.error('Error retrieving CID mapping from localStorage:', err);
        return convertedCid;
    }
};

// Get metadata from IPFS
export const fetchMetadata = async (cid) => {
    try {
        const originalCid = getOriginalCid(cid);

        // Try gateways in order of reliability
        const gateways = [
            'jade-electronic-puma-736.mypinata.cloud', // Your Pinata gateway (most reliable)
            'gateway.pinata.cloud',
            'cloudflare-ipfs.com',
            'dweb.link',
            'ipfs.io' // Public gateway (least reliable)
        ];

        // Try each gateway until one works
        let metadata = null;
        let errors = [];

        for (const gateway of gateways) {
            try {
                console.log(`Trying to fetch metadata from ${gateway}...`);
                const url = `https://${gateway}/ipfs/${originalCid}`;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Gateway ${gateway} returned ${response.status}`);
                }

                metadata = await response.json();
                console.log(`Successfully fetched metadata from ${gateway}:`, metadata);
                return metadata;
            } catch (err) {
                console.warn(`Failed to fetch from ${gateway}:`, err.message);
                errors.push(`${gateway}: ${err.message}`);
                // Continue to next gateway
            }
        }

        // If all gateways failed
        console.error("All gateways failed:", errors);
        return null;
    } catch (err) {
        console.error("Error fetching metadata:", err);
        return null;
    }
};

// Get IPFS gateway URL
export const getIpfsGatewayUrl = (cid, preferredGateway = null) => {
    if (!cid) return '';

    // Check if this is a converted CID and get the original if available
    const originalCid = getOriginalCid(cid);

    // If a specific gateway is requested, use it
    if (preferredGateway) {
        return `https://${preferredGateway}/ipfs/${originalCid}`;
    }

    // Default to Pinata gateway as it's more reliable for our content
    return `https://jade-electronic-puma-736.mypinata.cloud/ipfs/${originalCid}`;
};

// Try to convert a CID from v1 to v0 if possible
export const convertCidV1toV0 = (cidString) => {
    try {
        if (cidString.startsWith('Qm') && cidString.length === 46) {
            // Already a valid CIDv0
            console.log("CID is already in valid V0 format:", cidString);
            return { success: true, cidV0: cidString };
        }

        const cid = CID.parse(cidString);
        console.log("CID parsed successfully:", {
            version: cid.version,
            code: cid.code,
            multihash: {
                code: cid.multihash.code,
                size: cid.multihash.size,
                digestLength: cid.multihash.digest?.length
            }
        });

        // Check if it's using SHA-256 (required for v0)
        if (cid.multihash.code === 0x12 && cid.multihash.size === 34) {
            const cidV0 = CID.createV0(cid.multihash.digest);
            console.log("Successfully created CIDv0:", cidV0.toString(), "length:", cidV0.toString().length);
            return { success: true, cidV0: cidV0.toString() };
        } else {
            console.log("Cannot convert to CIDv0 - incompatible hash:", {
                expectedCode: 0x12,
                actualCode: cid.multihash.code,
                expectedSize: 34,
                actualSize: cid.multihash.size
            });
            return {
                success: false,
                error: "Cannot convert to CIDv0 - incompatible hash algorithm",
                details: {
                    hashCode: cid.multihash.code,
                    hashSize: cid.multihash.size,
                    cidVersion: cid.version
                }
            };
        }
    } catch (err) {
        console.error("Error parsing CID:", err);
        return { success: false, error: err.message };
    }
};

// Generate multiple gateway URLs for redundancy
export const getIpfsGatewayUrls = (cid) => {
    const originalCid = getOriginalCid(cid);
    return {
        pinata: `https://jade-electronic-puma-736.mypinata.cloud/ipfs/${originalCid}`,
        pinataGateway: `https://gateway.pinata.cloud/ipfs/${originalCid}`,
        cloudflare: `https://cloudflare-ipfs.com/ipfs/${originalCid}`,
        dweb: `https://dweb.link/ipfs/${originalCid}`,
        ipfsIo: `https://ipfs.io/ipfs/${originalCid}`
    };
}; 