import React from 'react';

const TestSimple = () =>{
  console.log('TestSimple component loaded!');
  
  return (<div style={{ padding: '50px', fontSize: '24px', color: 'black', backgroundColor: 'white'}}><><h1>TEST - If you see this, React is working</h1><p
</></>>Current time: {new Date().toLocaleTimeString()}</p><button onClick={() => alert('Button works!')}>Click me to test</button></div>
  );
};

export default TestSimple;