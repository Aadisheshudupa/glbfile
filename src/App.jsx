import { Canvas} from '@react-three/fiber'
import './App.css'
import CustomGizmoHelper from './CustomGizmoHelper.jsx';
import PerspectiveCameraWithHelper from './PerspectiveCameraWithHelper.jsx';
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import  {Stats} from '@react-three/drei'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { useState,useEffect,useRef } from 'react';
import { saveAs } from 'file-saver';
import ColorPickerGrid from './ColorPicker.jsx';


// Helper function to fetch file size
async function fetchFileSize(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      const size = response.headers.get('content-length');
      return parseInt(size, 10);
    } else {
      console.error(`Failed to fetch file size for ${url}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching file size for ${url}:`, error);
    return null;
  }
}

// Helper function to compress and export GLTF
async function compressAndExportGLTF(gltf, fileName) {
  const exporter = new GLTFExporter();
  const options = {
    binary: true,
    dracoOptions: {
      compressionLevel: 10
    }
  };

  return new Promise((resolve, reject) => {
    exporter.parse(gltf.scene, (result) => {
      const blob = new Blob([result], { type: 'application/octet-stream' });
      saveAs(blob, fileName);
      resolve(blob);
    }, (error) => {
      console.error('An error happened during GLTF export', error);
      reject(error);
    }, options);
  });
}

function Scene({ onModelLoaded }) {
  const path = "./model5.glb"; // Ensure this path is correct and the file is present
  const gltf = useLoader(GLTFLoader, path, loader => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    if (gltf) {
      onModelLoaded(gltf);
    }
  }, [gltf, onModelLoaded]);

  return <primitive object={gltf.scene} />;
}

export default function App() {
  const compressedFileName = "model_compressed.glb";
  const [isDownloaded,setDownload] = useState(true);
  const [hasDownloaded, setHasDownloaded] = useState(false); // New state to track if download has happened
  const [backgroundColor, setBackgroundColor] = useState('#3b3b3b');
  const [gridColor, setGridColor] = useState('#ffffff');
  const gridHelperRef = useRef(null);

  useEffect(() => {
    const originalPath = "/model5.glb"; // Ensure this path is correct and the file is present
    if(isDownloaded)
      {
    fetchFileSize(originalPath).then(size => {
      if (size !== null) {
        console.log("Original Model Size (bytes): ", size);
      }
    });
    setDownload(false);
  }
  }, []);

  const handleModelLoaded = async (gltf) => {
    if (hasDownloaded) return; // Return early if already downloaded

    try {
      const compressedBlob = await compressAndExportGLTF(gltf, compressedFileName);

      console.log("Compressed Model Size (bytes): ", compressedBlob.size);

      // For debugging: Log the GLTF object and options
      console.log("GLTF object:", gltf);
      console.log("Exporter options:", {
        binary: true,
        dracoOptions: {
          compressionLevel: 10
        }
      });
      setHasDownloaded(true); // Mark as downloaded

    } catch (error) {
      console.error("Error during compression and export:", error);
    }
  };

 
  return (
    <>
        <ColorPickerGrid setBackgroundColor={setBackgroundColor} setGridColor={setGridColor} gridHelperRef={gridHelperRef} />
      <Canvas camera={{position: [0, 0, 10]} }>
        <ambientLight/>
      <Scene onModelLoaded={handleModelLoaded} />
      <CustomGizmoHelper/>
     <PerspectiveCameraWithHelper position={[5, 4, 15]} far={10}/>
     <color attach="background" args={[backgroundColor]} />
        <gridHelper ref={gridHelperRef} args={[20, 20, gridColor, gridColor]} />
      <Stats/>
      </Canvas>
    </>
  )
}