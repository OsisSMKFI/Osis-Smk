type SupabaseLike = {
  storage: {
    listBuckets: () => Promise<{ data?: any[] | null; error: any }>;
    createBucket: (name: string, opts: { public: boolean; fileSizeLimit: number }) => Promise<{ error: any }>;
    updateBucket: (name: string, opts: { public: boolean; fileSizeLimit: number }) => Promise<{ error: any }>;
    getBucket: (name: string) => Promise<{ data?: { public?: boolean; name?: string } | null; error: any }>;
  };
};

export async function ensurePublicBucket(supabase: SupabaseLike, bucketName: string): Promise<boolean> {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('[ensurePublicBucket] Failed to list buckets:', listError);
      return false;
    }

    const exists = buckets?.some((b: any) => b.id === bucketName || b.name === bucketName);
    const fileSizeLimit = bucketName === 'backgrounds' ? 10485760 : 104857600;

    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit,
      });
      if (createError) {
        console.error(`[ensurePublicBucket] Failed to create bucket ${bucketName}:`, createError);
        return false;
      }
    } else {
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit,
      });
      if (updateError) {
        console.warn(`[ensurePublicBucket] Could not update bucket ${bucketName}:`, updateError);
      }
    }

    // Verify bucket is actually public
    const { data: bucketInfo, error: getError } = await supabase.storage.getBucket(bucketName);
    if (getError) {
      console.error(`[ensurePublicBucket] Failed to get bucket ${bucketName}:`, getError);
      return false;
    }

    if (bucketInfo?.public === true) {
      return true;
    }

    // Bucket exists but not public — try repair with minimal update
    console.warn(`[ensurePublicBucket] Bucket ${bucketName} is not public, attempting repair...`);
    const { error: repairError } = await supabase.storage.updateBucket(bucketName, {
      public: true,
      fileSizeLimit,
    });
    if (repairError) {
      console.error(`[ensurePublicBucket] Repair failed for ${bucketName}:`, repairError);
      return false;
    }

    // Verify again
    const { data: repairedBucket } = await supabase.storage.getBucket(bucketName);
    if (repairedBucket?.public !== true) {
      console.error(`[ensurePublicBucket] Bucket ${bucketName} still not public after repair`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ensurePublicBucket] Exception:', error);
    return false;
  }
}
