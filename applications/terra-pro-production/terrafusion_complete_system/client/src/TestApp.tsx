import { useSimpleAppraisal } from "./contexts/SimpleAppraisalContext";

function TestApp() {
  const { currentUser } = useSimpleAppraisal();

  return (
    <div className="p-8"><>

      <h1 className="text-3xl font-bold mb-4">Test App</h1>
      <p
</> className="text-lg">Current User: {currentUser?.fullName || "No user"}</p>
      <p className="mt-4">This is a test to see if the context provider works correctly.</p>
    </div>
  );
}

export default TestApp;
