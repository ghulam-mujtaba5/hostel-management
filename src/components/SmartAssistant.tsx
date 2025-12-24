"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, X, Send, Bot, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function SmartAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="relative">
      <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-lg">Smart Assistant</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Need help with task distribution or have questions about hostel rules? I'm here to help!
              </p>
              <div className="pt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" className="rounded-full text-xs">
                  Suggest tasks
                </Button>
                <Button size="sm" variant="secondary" className="rounded-full text-xs">
                  Check fairness
                </Button>
                <Button size="sm" onClick={() => setIsOpen(true)} className="rounded-full text-xs gap-2">
                  <MessageSquare className="h-3 w-3" /> Chat now
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 md:right-8 z-50 w-[calc(100vw-32px)] md:w-96"
          >
            <Card className="shadow-2xl border-primary/20 overflow-hidden">
              <CardHeader className="bg-primary p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2 text-primary-foreground">
                  <Bot className="h-5 w-5" />
                  <CardTitle className="text-base font-bold">HostelMate AI</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-background p-3 rounded-2xl rounded-tl-none text-sm shadow-sm border border-border/50">
                      Hello! How can I help you manage your hostel duties today?
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t bg-background">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setMessage("");
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-muted border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                    <Button type="submit" size="icon" className="rounded-full h-9 w-9">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
