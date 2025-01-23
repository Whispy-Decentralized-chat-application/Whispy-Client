import ThemeToggle from "./ThemeToggle";

const Header = () => {
    return (
      <header className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 shadow-md flex justify-between items-center">
                
        <div className="flex items-center">
        <img src="Whispy.png" alt="Logo" className="h-20 w-20" />
        <h1 className="text-xl font-bold">Whispy</h1>
        </div>
        

        <ThemeToggle/>
      </header>
    );
  };
  
  export default Header;