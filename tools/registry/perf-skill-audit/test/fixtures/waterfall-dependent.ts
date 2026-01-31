// Fixture: Dependent awaits that CANNOT be parallelized
declare const userId: string;
declare function fetchUser(id: string): Promise<{ profileId: string }>;
declare function fetchProfile(id: string): Promise<{ settingsId: string }>;
declare function fetchSettings(id: string): Promise<unknown>;

async function fetchDependentData() {
  const user = await fetchUser(userId);
  const profile = await fetchProfile(user.profileId); // ❌ Depends on user
  const settings = await fetchSettings(profile.settingsId); // ❌ Depends on profile

  return { user, profile, settings };
}

// This should NOT be transformed because each await depends on the previous result
