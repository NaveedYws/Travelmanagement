import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Send,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Compass,
  CheckCircle2,
  Package,
  MessageSquare,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { Product } from "@/lib/types";

export default function InquiryPage() {
  const { userId } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  // 6 Core Requested Fields: Name, Email, Phone No, Destination, Arrival Date, Pax
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [pax, setPax] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!userId) return;
    api
      .get<{ products: Product[] }>(`/api/products/index.php?user_id=${userId}`)
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          if (data.products.length > 0) {
            setSelectedProduct(String(data.products[0].id));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load products", err);
      });
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!destination.trim()) {
      toast.error("Please enter your target destination");
      return;
    }
    if (!arrivalDate.trim()) {
      toast.error("Please select your arrival date");
      return;
    }
    if (!pax.trim()) {
      toast.error("Please enter number of travelers (Pax)");
      return;
    }

    setSubmitting(true);
    try {
      // Pick product ID or default to first product
      let productId = selectedProduct;
      if (!productId || productId === "custom") {
        productId = products.length > 0 ? String(products[0].id) : "1";
      }

      await api.post("/api/inquiries/index.php", {
        product_id: productId,
        customer_name: name.trim(),
        contact_no: phone.trim(),
        email: email.trim(),
        destination: destination.trim(),
        arrival_date: arrivalDate,
        pax: pax.trim(),
        address: destination.trim(),
        message: message.trim() || null,
        source: "website",
      });

      setSubmitted(true);
      toast.success("Inquiry submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50/70 dark:bg-[#070a10] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0e131f]">
          <CardContent className="pt-9 pb-8 px-6 space-y-5">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Inquiry Submitted!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                Thank you <strong className="text-slate-800 dark:text-slate-200">{name}</strong>! We have received your inquiry for{" "}
                <strong className="text-blue-600 dark:text-blue-400">{destination}</strong>. Our travel specialist will contact you shortly.
              </p>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                <span>Trip Inquiry Summary</span>
                <span className="text-[11px] font-mono font-normal text-slate-400">Received</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{destination}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Arrival Date</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{arrivalDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Travelers (Pax)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{pax}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{phone}</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setPhone("");
                setDestination("");
                setArrivalDate("");
                setPax("");
                setMessage("");
              }}
              className="rounded-xl font-semibold text-xs h-10 px-5"
            >
              Submit Another Inquiry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#070a10] flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-xl rounded-2xl shadow-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0e131f] overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-7 text-white">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold mb-2 backdrop-blur-xs">
            <Compass className="w-3.5 h-3.5" />
            <span>Travel Inquiry Form</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Plan Your Next Getaway
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-md">
            Tell us your travel plans and our destination experts will design a customized itinerary for you.
          </p>
        </div>

        <CardContent className="p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Name & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="inq-name"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>Full Name *</span>
                </Label>
                <Input
                  id="inq-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Rahul Sharma"
                  maxLength={100}
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="inq-email"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>Email Address *</span>
                </Label>
                <Input
                  id="inq-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. rahul@example.com"
                  maxLength={120}
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
                />
              </div>
            </div>

            {/* 2. Phone No & Destination Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="inq-phone"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  <span>Phone Number *</span>
                </Label>
                <Input
                  id="inq-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="e.g. +91 98765 43210"
                  maxLength={25}
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="inq-destination"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Destination *</span>
                </Label>
                <Input
                  id="inq-destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  placeholder="e.g. Kashmir, Goa, Dubai..."
                  maxLength={120}
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
                />
              </div>
            </div>

            {/* 3. Arrival Date & Pax Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="inq-arrival"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Arrival Date *</span>
                </Label>
                <Input
                  id="inq-arrival"
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="inq-pax"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Number of Pax *</span>
                </Label>
                <Input
                  id="inq-pax"
                  value={pax}
                  onChange={(e) => setPax(e.target.value)}
                  required
                  placeholder="e.g. 2 Adults, 1 Child"
                  maxLength={50}
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
                />
              </div>
            </div>

            {/* 4. Product / Package Selection (Optional) */}
            {products.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>Interested Package (Optional)</span>
                </Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900">
                    <SelectValue placeholder="Select a package or custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom" className="text-xs">
                      Custom Itinerary / General Inquiry
                    </SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                        {p.name}{" "}
                        {p.price
                          ? `— ₹${Number(p.price).toLocaleString("en-IN")}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 5. Message / Notes (Optional) */}
            <div className="space-y-1.5">
              <Label
                htmlFor="inq-msg"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span>Special Requests / Notes (Optional)</span>
              </Label>
              <Textarea
                id="inq-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hotel category, meal preferences, flight requirements, etc..."
                rows={3}
                maxLength={500}
                className="text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 resize-none"
              />
            </div>

            {/* 6. Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 gap-2 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? "Submitting Inquiry..." : "Submit Inquiry"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
