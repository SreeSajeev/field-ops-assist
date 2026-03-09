import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const OFFICE_ADDRESS = [
  "PARISKQ IOT SOLUTIONS PRIVATE LIMITED",
  "#19, 1st Floor, Ranoji Rao Road",
  "Basavanagudi",
  "Bangalore 560004",
  "India",
];

const OFFICE_EMAIL = "enquiry@pariskq.in";
const OFFICE_PHONE = "+91 98801 18388";

const MAP_EMBED_URL =
  "https://www.google.com/maps?q=19+Ranoji+Rao+Road+Basavanagudi+Bangalore+560004&output=embed";

export default function EnquiryPage() {
  const [name, setName] = useState("");
  const [products, setProducts] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Placeholder: in production you would POST to an API or email service
      await new Promise((r) => setTimeout(r, 600));
      toast({
        title: "Message sent",
        description: "We'll get back to you as soon as possible.",
      });
      setName("");
      setProducts("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      toast({
        title: "Failed to send",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/sahaya-logo.png" alt="Sahaya" className="h-8 w-auto" />
            <span className="text-sm font-bold text-gray-900">Sahaya</span>
            <span className="text-[9px] font-semibold uppercase text-gray-500">by Pariskq</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/enquiry"
              className="text-sm font-medium text-primary hover:underline"
            >
              Enquiry
            </Link>
            <Link to="/login">
              <Button size="sm">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Contact form */}
          <div>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-8">
              Whether you have a question, a suggestion, or just want to say hello, this is the place to do it.
              Please fill out the form below with your details and message, and we'll get back to you as soon as possible.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="products">Products interested in</Label>
                  <Input
                    id="products"
                    placeholder="e.g. ADAS Camera's"
                    value={products}
                    onChange={(e) => setProducts(e.target.value)}
                    className="rounded-lg border-gray-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Your Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-lg border-gray-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Your Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="rounded-lg border-gray-300 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto bg-[#4d2966] hover:bg-[#5a3075] text-white rounded-lg px-8 py-2.5"
              >
                {sending ? "Sending…" : "Send Message"}
              </Button>
            </form>
          </div>

          {/* Right: Office info + map */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Our Office</h2>
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-[4/3] min-h-[280px]">
              <iframe
                title="Office location"
                src={MAP_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "280px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full h-full min-h-[280px]"
              />
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Office Location
                  </p>
                  <p className="text-sm leading-relaxed">
                    {OFFICE_ADDRESS.map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < OFFICE_ADDRESS.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Send a Message
                  </p>
                  <a
                    href={`mailto:${OFFICE_EMAIL}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {OFFICE_EMAIL}
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Call Us Directly
                  </p>
                  <a
                    href={`tel:${OFFICE_PHONE.replace(/\s/g, "")}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {OFFICE_PHONE}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
