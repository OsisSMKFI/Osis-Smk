type SupabaseLike = {
  storage: {
    listBuckets: () => Promise<{ data?: any[] | null; error: any }>;
    createBucket: (name: string, opts: { public: boolean; fileSizeLimit: number }) => Promise<{ error: any }>;
    updateBucket: (name: string, opts: { public: boolean; fileSizeLimit: number }) => Promise<{ error: any }>;
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
      return true;
    }

    const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
      public: true,
      fileSizeLimit,
    });
    if (updateError) {
      console.warn(`[ensurePublicBucket] Could not update bucket ${bucketName}:`, updateError);
    }
    return true;
  } catch (error) {
    console.error('[ensurePublicBucket] Exception:', error);
    return false;
  }
}
