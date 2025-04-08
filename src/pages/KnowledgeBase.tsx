
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Leaf, AlertTriangle } from "lucide-react";

const KnowledgeBase = () => {
  return (
    <Layout>
      <div className="container mx-auto space-y-6">
        <div className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-blue-500" />
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
        </div>
        
        <p className="text-muted-foreground">
          Access comprehensive information about maize farming, common diseases, and best practices.
        </p>
        
        <Tabs defaultValue="diseases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="diseases">Common Diseases</TabsTrigger>
            <TabsTrigger value="practices">Best Practices</TabsTrigger>
            <TabsTrigger value="planting">Planting Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diseases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Common Maize Diseases
                </CardTitle>
                <CardDescription>
                  Learn about common diseases affecting maize plants and how to identify them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Northern Leaf Blight</h3>
                  <p>Long, elliptical gray-green or tan lesions on leaves. During humid conditions, the fungus produces dark gray spores, giving the lesions a dirty appearance.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Gray Leaf Spot</h3>
                  <p>Small, circular to rectangular, water-soaked spots that become grayish. In humid conditions, the spots elongate and become tan to brown with yellow borders.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Common Rust</h3>
                  <p>Small, circular to oval, cinnamon-brown pustules scattered on both leaf surfaces, which turn brownish-black as the plant matures.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Maize Streak Virus</h3>
                  <p>Narrow, broken, chlorotic streaks along the veins that eventually enlarge and merge to produce broad chlorotic stripes with irregular edges.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="practices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="h-5 w-5 mr-2 text-green-500" />
                  Farming Best Practices
                </CardTitle>
                <CardDescription>
                  Effective techniques for better maize yields and healthier crops.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Crop Rotation</h3>
                  <p>Rotate maize with non-grass crops like legumes to reduce soil-borne diseases and improve soil health.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Proper Spacing</h3>
                  <p>Plant maize seeds at a proper spacing (usually 75cm between rows and 25cm between plants) to ensure adequate sunlight and airflow.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Weed Control</h3>
                  <p>Control weeds especially during the first 6 weeks after planting when maize plants are most vulnerable to weed competition.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Water Management</h3>
                  <p>Ensure adequate irrigation, especially during critical growth stages like tasseling and ear formation.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="planting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="h-5 w-5 mr-2 text-green-500" />
                  Planting Guide
                </CardTitle>
                <CardDescription>
                  Step-by-step guide for planting and growing healthy maize crops.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">When to Plant</h3>
                  <p>Plant when soil temperatures reach about 18°C (65°F) for good germination. This is typically after the last frost date in your region.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Soil Preparation</h3>
                  <p>Prepare a fine seedbed by plowing and harrowing. Add compost or well-rotted manure to improve soil fertility.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Planting Depth</h3>
                  <p>Plant seeds at a depth of 2.5-5cm (1-2 inches) depending on soil moisture. Plant deeper in drier conditions.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Seed Rate</h3>
                  <p>Use approximately 20-25kg of seed per hectare, aiming for a final plant population of 50,000-70,000 plants per hectare.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default KnowledgeBase;
