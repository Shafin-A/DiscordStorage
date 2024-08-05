import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";

const App = () => {
  return (
    <div className="flex min-h-screen w-full bg-muted/40 dark:bg-zinc-900">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6">
        <Header breadcrumbs={[{ href: "/", label: "Home" }]} page="Document" />
      </div>
    </div>
  );
};

export default App;
