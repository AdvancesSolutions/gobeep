import { ChevronLeft } from "lucide-react";
import AnimatedPoints from "@/components/AnimatedPoints";
import beepLogo from "@/assets/beep-logo.png";

interface PageHeaderProps {
  title: string;
  onBack: () => void;
}

const PageHeader = ({ title, onBack }: PageHeaderProps) => {
  return (
    <div className="px-4 pt-12 pb-4 flex items-center gap-3">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center"
      >
        <ChevronLeft size={20} className="text-card-dark-foreground" />
      </button>
      <div className="flex items-center gap-2 flex-1">
        <img src={beepLogo} alt="BEEP" className="w-6 h-6 object-contain" />
        <span className="text-muted-foreground/40 text-sm font-light">|</span>
        <h1 className="text-base font-bold text-foreground">{title}</h1>
      </div>
      <AnimatedPoints />
    </div>
  );
};

export default PageHeader;
