// Fixture: Independent awaits that CAN be parallelized
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function fetchUsers(): Promise<unknown>;
declare function fetchPosts(): Promise<unknown>;
declare function fetchComments(): Promise<unknown>;

async function fetchData() {
  const users = await fetchUsers();
  const posts = await fetchPosts();
  const comments = await fetchComments();

  return { users, posts, comments };
}

// Should become:
// const [users, posts, comments] = await Promise.all([
//   fetchUsers(),
//   fetchPosts(),
//   fetchComments(),
// ]);
