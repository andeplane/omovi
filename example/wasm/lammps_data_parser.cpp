#include <iostream>
#include <string>
#include <regex>
#include <sstream>
#include <string>
#include <fstream>

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
using namespace emscripten;
#endif

enum AtomStyle
{
  NotSet,
  Atomic,
  Molecular
};

std::string line;

class SimulationBox
{
public:
  SimulationBox(std::string content);
  int numAtoms, numAtomTypes;
  float xlo, xhi;
  float ylo, yhi;
  float zlo, zhi;
  float xy, xz, yz;
  AtomStyle atomStyle = AtomStyle::NotSet;
  int *types;
  int *ids;
  int *molIds;
  float *positions;
  long getIdsPointer() { return (long)ids; }
  long getTypesPointer() { return (long)types; }
  long getMolIdsPointer() { return (long)molIds; }
  long getPositionsPointer() { return (long)positions; }
};

void ensureContains(std::string string, std::string needle)
{
  if (string.find(needle) == std::string::npos)
  {
    std::string errorMessage = std::string("Error parsing line ") + string + std::string(". Tried to find needle ") + needle;
    throw std::invalid_argument(errorMessage);
  }
}

void parseInts(std::stringstream &stream, std::string needle, std::vector<int *> values)
{
  std::getline(stream, line);
  ensureContains(line, needle);
  const char *linePtr = line.c_str();
  auto token = std::strtok((char *)linePtr, " ");
  for (int i = 0; i < values.size(); i++)
  {
    (*values[i]) = std::atoi(token);
    token = strtok(NULL, " ");
  }
}

void parseFloats(std::stringstream &stream, std::string needle, std::vector<float *> values)
{
  std::getline(stream, line);
  ensureContains(line, needle);
  const char *linePtr = line.c_str();
  auto token = std::strtok((char *)linePtr, " ");
  for (int i = 0; i < values.size(); i++)
  {
    (*values[i]) = std::atof(token);
    token = strtok(NULL, " ");
  }
}

void parseAtomStyle(std::stringstream &stream, SimulationBox &box)
{
  std::getline(stream, line);
  ensureContains(line, "Atoms");
  if (box.atomStyle == AtomStyle::NotSet)
  {
    if (line.find("molecular") != std::string::npos)
    {
      box.atomStyle = AtomStyle::Molecular;
    }
    else
    {
      box.atomStyle = AtomStyle::Atomic;
    }
  }
}

void parseLineAtomic(std::stringstream &stream, SimulationBox &box, int lineIndex)
{
  std::getline(stream, line);
  const char *linePtr = line.c_str();
  auto token = std::strtok((char *)linePtr, " ");
  box.ids[lineIndex] = std::atoi(token);
  token = std::strtok(NULL, " ");
  box.types[lineIndex] = std::atoi(token);
  token = std::strtok(NULL, " ");
  box.positions[3 * lineIndex + 0] = std::atof(token);
  token = std::strtok(NULL, " ");
  box.positions[3 * lineIndex + 1] = std::atof(token);
  token = std::strtok(NULL, " ");
  box.positions[3 * lineIndex + 2] = std::atof(token);
  token = std::strtok(NULL, " ");
}

void parseLineMolecular(std::stringstream &stream, SimulationBox &box, int lineIndex)
{
  std::getline(stream, line);
  // std::string token;

  // std::getline(stream, token, ' ');
  // box.ids[lineIndex] = std::stoi(token);
  // std::getline(stream, token, ' ');
  // box.molIds[lineIndex] = std::stoi(token);
  // std::getline(stream, token, ' ');
  // box.types[lineIndex] = std::stoi(token);
  // std::getline(stream, token, ' ');
  // box.positions[3 * lineIndex + 0] = std::stof(token);
  // std::getline(stream, token, ' ');
  // box.positions[3 * lineIndex + 1] = std::stof(token);
  // std::getline(stream, token, ' ');
  // box.positions[3 * lineIndex + 2] = std::stof(token);

  const char *linePtr = line.c_str();
  auto token = std::strtok((char *)linePtr, " ");
  box.ids[lineIndex] = std::atoi(token);
  token = std::strtok(NULL, " ");
  box.molIds[lineIndex] = std::atoi(token);
  token = std::strtok(NULL, " ");
  box.types[lineIndex] = std::atoi(token);
  token = std::strtok(NULL, " ");
  box.positions[3 * lineIndex + 0] = std::atof(token);
  token = std::strtok(NULL, " ");
  box.positions[3 * lineIndex + 1] = std::atof(token);
  token = std::strtok(NULL, " ");
  box.positions[3 * lineIndex + 2] = std::atof(token);
  token = std::strtok(NULL, " ");
}

SimulationBox::SimulationBox(std::string content)
{
  std::stringstream stream(content);
  // Skip first line
  std::getline(stream, line);
  parseInts(stream, "atoms", {&numAtoms});
  parseInts(stream, "atom types", {&numAtomTypes});
  parseFloats(stream, "xlo xhi", {&xlo, &xhi});
  parseFloats(stream, "ylo yhi", {&ylo, &yhi});
  parseFloats(stream, "zlo zhi", {&zlo, &zhi});
  parseFloats(stream, "xy xz yz", {&xy, &xz, &yz});
  std::getline(stream, line);
  parseAtomStyle(stream, *this);
  std::getline(stream, line);
  types = new int[numAtoms];
  positions = new float[3 * numAtoms];
  molIds = new int[numAtoms];
  ids = new int[numAtoms];

  for (int lineIndex = 0; lineIndex < numAtoms; lineIndex++)
  {
    // if (lineIndex % 100000 == 0)
    // {
    //   std::cout << "Parsing line " << lineIndex << std::endl;
    // }

    if (atomStyle == AtomStyle::Atomic)
    {
      parseLineAtomic(stream, *this, lineIndex);
    }
    else if (atomStyle == AtomStyle::Molecular)
    {
      parseLineMolecular(stream, *this, lineIndex);
    }
  }
}

#ifdef __EMSCRIPTEN__
// Binding code
EMSCRIPTEN_BINDINGS(SimulationBox)
{
  class_<SimulationBox>("SimulationBox")
      .constructor<std::string>()
      .property("numAtoms", &SimulationBox::numAtoms)
      .property("numAtomTypes", &SimulationBox::numAtomTypes)
      .property("xlo", &SimulationBox::xlo)
      .property("xhi", &SimulationBox::xhi)
      .property("ylo", &SimulationBox::ylo)
      .property("yhi", &SimulationBox::yhi)
      .property("zlo", &SimulationBox::zlo)
      .property("zhi", &SimulationBox::zhi)
      .property("xy", &SimulationBox::xy)
      .property("xz", &SimulationBox::xz)
      .property("yz", &SimulationBox::yz)
      .function("getIdsPointer", &SimulationBox::getIdsPointer)
      .function("getTypesPointer", &SimulationBox::getTypesPointer)
      .function("getMolIdsPointer", &SimulationBox::getMolIdsPointer)
      .function("getPositionsPointer", &SimulationBox::getPositionsPointer);
}
#else
int main(int nargs, char **argv)
{
  std::ifstream file(argv[1]);
  std::ostringstream sstr;
  sstr << file.rdbuf();
  auto box = SimulationBox(sstr.str());
  std::cout << "Got box with " << box.numAtoms << " atoms";
  return 0;
}
#endif