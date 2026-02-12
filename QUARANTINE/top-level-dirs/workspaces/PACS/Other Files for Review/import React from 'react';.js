import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, Button, Slider, Select, Layout, Row, Col, Switch, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const properties = [
  { id: 1, address: "106 Oakmont Ct", price: 484750, coordinates: [46.291, -119.285], beds: 3, baths: 2, sqft: 2534 },
  { id: 2, address: "2112 Sheridan Pl", price: 415000, coordinates: [46.283, -119.277], beds: 4, baths: 3, sqft: 2413 },
  // Add more property data here...
];

const App = () => {
  return (
    <Layout style={{ height: '100vh' }}>
      <Header className="header">
        <Title style={{ color: 'white' }} level={2}>Dynamic Property Search</Title>
        <Switch style={{ float: 'right' }} checkedChildren="Dark" unCheckedChildren="Light" defaultChecked />
      </Header>
      <Layout>
        <Sider width={300} className="site-layout-background">
          <Title level={4} style={{ padding: '16px' }}>Filters</Title>
          <div style={{ padding: '16px' }}>
            <Slider range min={100000} max={1000000} defaultValue={[200000, 600000]} />
            <Select placeholder="Bedrooms" style={{ width: '100%', marginTop: '16px' }}>
              <Select.Option value="1">1</Select.Option>
              <Select.Option value="2">2</Select.Option>
              <Select.Option value="3">3</Select.Option>
              <Select.Option value="4+">4+</Select.Option>
            </Select>
            <Button type="primary" style={{ marginTop: '16px' }} block>Apply Filters</Button>
          </div>
        </Sider>
        <Content style={{ padding: '0 24px', minHeight: 280 }}>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {properties.map(property => (
              <Col span={8} key={property.id}>
                <Card hoverable title={property.address} extra={<Button type="link">Details</Button>}>
                  <p>Price: ${property.price}</p>
                  <p>Beds: {property.beds} | Baths: {property.baths}</p>
                  <p>Sq Ft: {property.sqft}</p>
                </Card>
              </Col>
            ))}
          </Row>
          <MapContainer center={[46.291, -119.285]} zoom={13} style={{ height: '400px' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            {properties.map(property => (
              <Marker key={property.id} position={property.coordinates}>
                <Popup>
                  {property.address} <br /> Price: ${property.price}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div style={{ marginTop: '24px' }}>
            <Title level={4}>Market Trends</Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={properties.map(p => ({ name: p.address, price: p.price }))}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
