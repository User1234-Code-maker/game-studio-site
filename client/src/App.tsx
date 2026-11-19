import { Route, Routes } from "react-router-dom";
import { OopsProvider } from "@/components/OopsProvider";
import { ScrollManager } from "@/components/ScrollManager";
import { AboutPage } from "@/pages/AboutPage";
import { ContactPage } from "@/pages/ContactPage";
import { HomePage } from "@/pages/HomePage";
import { NewsPage } from "@/pages/NewsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OrderResultPage } from "@/pages/OrderResultPage";

export function App() {
  return (
    <OopsProvider>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/order/success" element={<OrderResultPage outcome="success" />} />
        <Route path="/order/cancel" element={<OrderResultPage outcome="cancel" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </OopsProvider>
  );
}
