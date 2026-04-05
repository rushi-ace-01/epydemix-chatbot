import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
// EPYDEMIX KNOWLEDGE BASE — Ground truth extracted from:
//   - GitHub README, tutorials 01–10
//   - ReadTheDocs API reference (epydemix 1.0.2)
//   - PLOS Computational Biology paper (Gozzi et al. 2025)
//   - medRxiv preprint
// ═══════════════════════════════════════════════════════════════════

const KNOWLEDGE_BASE = [
  { id: "epimodel-class", title: "EpiModel Class", category: "api",
    tags: ["EpiModel","class","model","define","create","represent","core","constructor","init","initialize"],
    content: `The EpiModel class is the central object in Epydemix for defining and running epidemic models. It is initialized with:
- name (str): A name for the model (default: 'EpiModel')
- compartments (list): List of compartment names (e.g., ["S", "I", "R"])
- parameters (dict): Dictionary of parameter names and values (e.g., {"beta": 0.3, "gamma": 0.1})
- population_name (str): Name of the population (default: 'epydemix_population')
- use_default_population (bool): Whether to use a default homogeneous population of 100,000 individuals

Example:
\`\`\`python
from epydemix import EpiModel
model = EpiModel(
    name="SIR Model",
    compartments=["S", "I", "R"],
    parameters={"beta": 0.3, "gamma": 0.1}
)
\`\`\`

By default, when an EpiModel instance is created without specific population parameters, Epydemix creates a single population with 100,000 individuals homogeneously mixed.

The EpiModel class provides methods such as:
- add_transition(): Add transitions between compartments
- add_compartments(): Add new compartments
- set_population(): Assign a Population object
- import_epydemix_population(): Load population data
- run_simulations(): Run multiple stochastic simulations
- add_interventions(): Add non-pharmaceutical interventions
- override_parameter(): Override parameter values for specific time periods
- register_transition_kind(): Register custom transition types
- set_initial_conditions(): Set initial conditions
- create_default_initial_conditions(): Create default initial conditions
- compute_contact_reductions(): Compute contact matrix reductions from interventions
- clear_transitions(): Reset all transitions`,
    source: "ReadTheDocs API Reference + Tutorial 01" },

  { id: "epimodel-represents", title: "What EpiModel Represents", category: "conceptual",
    tags: ["EpiModel","represent","what","purpose","stochastic","compartmental","meaning"],
    content: `The EpiModel class represents a stochastic compartmental epidemic model. It encapsulates the full specification of an epidemic model including:

1. Compartments: The possible states individuals can be in (e.g., Susceptible, Infected, Recovered)
2. Transitions: Rules governing how individuals move between compartments
3. Parameters: Values controlling transition rates
4. Population: Demographic structure and contact patterns

Models built with EpiModel follow a stochastic chain binomial approach. At each time step, the number of individuals transitioning between compartments is drawn from a binomial distribution. Transition rates are converted to discrete-time risks using the standard exponential transformation.

Beyond health status, compartments can also represent vaccination status or behavioral attributes associated with adoption or relaxation of non-pharmaceutical interventions (NPIs).`,
    source: "PLOS Computational Biology paper + Tutorial 01" },

  { id: "transitions", title: "Transitions in Epydemix", category: "api",
    tags: ["transition","add_transition","mediated","spontaneous","kind","params","source","target","rate","type"],
    content: `Transitions define how individuals move between compartments. They are added using model.add_transition(). There are two main types:

1. Mediated Transitions: Driven by interactions between individuals in different compartments (e.g., infection from contact with infected individuals).
   - params is a tuple: (rate_or_param_name, mediating_compartment)
   - Example: model.add_transition(source="S", target="I", params=(0.3, "I"), kind="mediated")
   - Example with named param: model.add_transition(source="S", target="I", params=("beta", "I"), kind="mediated")

2. Spontaneous Transitions: Occur independently of interactions (e.g., recovery, waning immunity).
   - params is a float or string (parameter name)
   - Example: model.add_transition(source="I", target="R", params=0.1, kind="spontaneous")
   - Example with named param: model.add_transition(source="I", target="R", params="gamma", kind="spontaneous")

For mediated transitions, params can use mathematical expressions combining parameter names (e.g., "beta*psi" for strain-dependent transmission).

Custom transition types can be registered using model.register_transition_kind(), which takes a user-defined name and a function specifying how to compute its transition rate.`,
    source: "Tutorial 01 + Tutorial 06 + Tutorial 08" },

  { id: "sir-model", title: "SIR Model in Epydemix", category: "tutorial",
    tags: ["SIR","model","susceptible","infected","recovered","predefined","load","create","basic","simple"],
    content: `The SIR (Susceptible-Infected-Recovered) model is one of the simplest compartmental models. In Epydemix, it can be created in two ways:

Method 1 — Manual definition:
\`\`\`python
from epydemix import EpiModel

model = EpiModel(
    name="SIR Model",
    compartments=["S", "I", "R"],
)
model.add_transition(source="S", target="I", params=(0.3, "I"), kind="mediated")
model.add_transition(source="I", target="R", params=0.1, kind="spontaneous")
\`\`\`

Method 2 — Using predefined models:
\`\`\`python
from epydemix import load_predefined_model

model = load_predefined_model("SIR")
\`\`\`

The predefined model loader (load_predefined_model) supports "SIR", "SEIR", and "SIS" as model names.

In the SIR model:
- S: Susceptible individuals who can become infected
- I: Infected individuals currently carrying the disease
- R: Recovered individuals who are immune
- The infection transition (S→I) is mediated by contact with I individuals
- The recovery transition (I→R) is spontaneous`,
    source: "README + Tutorial 01 + ReadTheDocs API" },

  { id: "seir-model", title: "SEIR Model in Epydemix", category: "tutorial",
    tags: ["SEIR","model","exposed","susceptible","infected","recovered","predefined","load","create","latent","incubation"],
    content: `The SEIR (Susceptible-Exposed-Infected-Recovered) model extends SIR by adding an Exposed compartment for the latent/incubation period. In Epydemix:

Method 1 — Manual definition:
\`\`\`python
from epydemix import EpiModel

model = EpiModel(
    name="SEIR Model",
    compartments=["S", "E", "I", "R"],
)
model.add_transition(source="S", target="E", params=("beta", "I"), kind="mediated")
model.add_transition(source="E", target="I", params="sigma", kind="spontaneous")
model.add_transition(source="I", target="R", params="gamma", kind="spontaneous")
\`\`\`

Method 2 — Using predefined models:
\`\`\`python
from epydemix import load_predefined_model

model = load_predefined_model("SEIR")
\`\`\`

The SEIR model compartments:
- S: Susceptible — can be exposed through contact with I
- E: Exposed — infected but not yet infectious (latent period)
- I: Infectious — can transmit disease
- R: Recovered — immune

Key parameters:
- beta: Transmission rate (S→E, mediated by I)
- sigma: Rate of progression from E to I (1/sigma = average incubation period)
- gamma: Recovery rate (1/gamma = average infectious period)

The predefined SEIR model is created internally by create_seir() in epydemix.model.predefined_models.`,
    source: "ReadTheDocs API + README + PLOS paper" },

  { id: "sis-model", title: "SIS Model in Epydemix", category: "tutorial",
    tags: ["SIS","model","susceptible","infected","predefined","load","create","endemic","reinfection"],
    content: `The SIS (Susceptible-Infected-Susceptible) model represents diseases where recovery does not confer immunity. In Epydemix:

Method 1 — Manual definition:
\`\`\`python
from epydemix import EpiModel

model = EpiModel(
    name="SIS Model",
    compartments=["S", "I"],
)
model.add_transition(source="S", target="I", params=("beta", "I"), kind="mediated")
model.add_transition(source="I", target="S", params="gamma", kind="spontaneous")
\`\`\`

Method 2 — Using predefined models:
\`\`\`python
from epydemix import load_predefined_model

model = load_predefined_model("SIS")
\`\`\`

The SIS model compartments:
- S: Susceptible — can become infected
- I: Infected — recovers back to susceptible (no immunity)

Key parameters:
- beta: Transmission rate (S→I, mediated by I)
- gamma: Recovery rate (I→S)

This model is useful for endemic diseases where immunity is not long-lasting.`,
    source: "ReadTheDocs API + PLOS paper" },

  { id: "simulation", title: "Running Simulations", category: "api",
    tags: ["simulate","run_simulations","stochastic","simulation","run","results","Nsim","start_date","end_date","time_steps","dt","time","step","days","duration"],
    content: `Simulations in Epydemix are stochastic and follow a chain binomial approach. There are two ways to run simulations:

1. model.run_simulations() — runs multiple simulations:
\`\`\`python
results = model.run_simulations(
    start_date="2024-01-01",
    end_date="2024-04-10",
    Nsim=100,
)
\`\`\`

2. simulate(epimodel, ...) — runs a single simulation:
\`\`\`python
from epydemix import simulate
trajectory = simulate(
    model,
    start_date="2024-01-01",
    end_date="2024-04-10",
    dt=1.0,
    initial_conditions_dict=None,
    percentage_in_agents=0.0005,
)
\`\`\`

Key parameters:
- start_date, end_date: Simulation period
- Nsim: Number of stochastic simulations to run (default: 100)
- dt: Time step in days (default: 1.0)
- initial_conditions_dict: Custom initial conditions (optional)
- percentage_in_agents: Default fraction placed in agent/infected compartments (0.0005 = 0.05%)
- resample_frequency: Resampling frequency (default: 'D' for daily)

If initial conditions are not provided, Epydemix initializes 0.05% of individuals in compartments that mediate transitions and the rest in source compartments.

Results are stored in a SimulationResults object, which provides:
- get_quantiles_compartments(): Extract quantiles of compartment counts
- get_quantiles_transitions(): Extract quantiles of transition counts`,
    source: "Tutorial 01 + ReadTheDocs API" },

  { id: "stochastic-engine", title: "Numerical Simulation Method (Stochastic Engine)", category: "conceptual",
    tags: ["numerical","solver","ODE","integration","stochastic","chain","binomial","engine","internally","method","deterministic","Runge","Kutta","Euler","differential","equation"],
    content: `Epydemix does NOT use a traditional ODE solver/integrator internally. Instead, it uses a stochastic chain binomial approach.

At each time step δt:
1. For each transition from compartment X_k to Y_k, the number of transitioning individuals is drawn from a Binomial distribution: Bin(X_k, p_transition)
2. Transition rates are converted to discrete-time probabilities using the exponential transformation: p = 1 - exp(-rate * δt)
3. When a compartment has multiple outgoing transitions, a multinomial distribution is used to allocate individuals across the possible destination compartments.

This is fundamentally different from deterministic ODE integration (like Runge-Kutta or Euler methods). The stochastic approach:
- Captures randomness inherent in disease transmission
- Produces different outcomes each run (hence running multiple simulations)
- Is well-suited for small populations or early outbreak dynamics where stochasticity matters

The simulation steps through time with a configurable time step dt (default: 1 day).

Key functions in the engine:
- stochastic_simulation(): Core simulation loop
- compute_mediated_transition_rate(): Computes rates for mediated transitions
- compute_spontaneous_transition_rate(): Computes rates for spontaneous transitions`,
    source: "PLOS Computational Biology paper + ReadTheDocs API" },

  { id: "population", title: "Population Data and Contact Matrices", category: "api",
    tags: ["population","contact","matrix","age","demographic","load","Italy","country","epydemix_data","set_population","load_epydemix_population","Population","region","geography","United_States","Kenya","world","available","locations","countries"],
    content: `Epydemix supports real-world population data and synthetic contact matrices for over 400 regions worldwide through the epydemix-data package.

Loading population data:
\`\`\`python
from epydemix.population import load_epydemix_population

population = load_epydemix_population(
    population_name="Italy",
    contacts_source="mistry_2021",
    layers=["home", "work", "school", "community"],
)

model.set_population(population)
\`\`\`

Key features:
- Online import: If path_to_data is not provided, data is fetched from GitHub
- Offline import: If path_to_data is provided, loads from a local directory
- Contact layers: home, work, school, community
- Age-stratified: Supports custom age group mappings
- Default population: 100,000 homogeneously mixed individuals (when no population is specified)

Available functions:
- load_epydemix_population(): Load population by name
- get_available_locations(): List all available locations
- validate_population_name(): Check if a population name is valid
- get_primary_contacts_source(): Get the default contact source

Population data comes from the epydemix-data package (separate GitHub repository). To see all available locations, use:
\`\`\`python
from epydemix.population import get_available_locations
locations = get_available_locations()
\`\`\``,
    source: "Tutorial 02 + README + PLOS paper" },

  { id: "calibration", title: "Model Calibration with ABC", category: "api",
    tags: ["calibration","ABC","ABCSampler","calibrate","posterior","inference","parameter","fitting","Bayesian","optimize","fit","estimate","prior","rejection","smc","top_fraction","distance","tolerance","gradient","descent"],
    content: `Epydemix uses Approximate Bayesian Computation (ABC) for model calibration — NOT gradient descent or other optimization methods. ABC enables inference by comparing observed and simulated data without requiring explicit likelihood evaluation.

The core calibration object is ABCSampler:
\`\`\`python
from epydemix.calibration import ABCSampler, rmse
from scipy import stats

priors = {
    "beta": stats.uniform(loc=0.1, scale=0.5),
    "gamma": stats.uniform(loc=0.05, scale=0.2),
}

abc_sampler = ABCSampler(
    priors=priors,
    distance_function=rmse,
    simulation_function=sim_func,
    observed_data=observed_data
)
\`\`\`

Three calibration strategies are supported:

1. ABC Rejection (strategy="rejection"):
   - Requires tolerance ε and population size P
   - Samples parameters from priors, accepts if distance < ε

2. Top Fraction (strategy="top_fraction"):
   - Replaces fixed tolerance with simulation budget B and selection percentage x
   - Runs B simulations, selects top x% based on distance

3. ABC-SMC (strategy="smc"):
   - Most sophisticated method, uses T generations with progressively smaller tolerances
   - Each generation's prior is the posterior from the previous generation
   - Based on Toni et al., 2009

Example:
\`\`\`python
results_smc = abc_sampler.calibrate(strategy="smc", nparticles=1000, ngenerations=5)
\`\`\`

The calibrate method returns a CalibrationResults object. After calibration, abc_sampler.run_projections() allows running forward projections.

Important: Epydemix does NOT use gradient descent. It uses simulation-based ABC methods.`,
    source: "Tutorial 04 + Tutorial 05 + PLOS paper" },

  { id: "interventions", title: "Non-Pharmaceutical Interventions", category: "tutorial",
    tags: ["intervention","NPI","school","closure","workplace","reduction","add_interventions","override_parameter","contact","lockdown","quarantine","masking","social","distancing","policy"],
    content: `Epydemix supports modeling non-pharmaceutical interventions (NPIs) through two methods:

1. add_interventions(): Modifies contact matrices at specific times
\`\`\`python
model.add_interventions(
    start_date="2024-02-01",
    end_date="2024-03-01",
    layer="school",
    reduction=0.8
)
\`\`\`

2. override_parameter(): Overrides parameter values for specific time periods
\`\`\`python
model.override_parameter(
    param_name="beta",
    value=0.1,
    start_date="2024-02-01",
    end_date="2024-03-01"
)
\`\`\`

Interventions can target specific contact layers: home, work, school, community.`,
    source: "Tutorial 03 + PLOS paper" },

  { id: "visualization", title: "Visualization Tools", category: "api",
    tags: ["plot","visualization","plot_quantiles","plot_posterior","chart","graph","display","figure","show","visualize","draw","plot_population","plot_contact_matrix","plot_spectral_radius","matplotlib","confidence","interval"],
    content: `Epydemix provides built-in visualization tools in the epydemix.visualization module:

Functions available:
- plot_quantiles(df_quantiles, columns): Plot compartment/transition time series with median and confidence intervals
- plot_posterior_distribution(): Plot 1D posterior parameter distributions from calibration
- plot_posterior_distribution_2d(): Plot joint 2D posterior distributions
- plot_population(): Visualize population distribution across demographic groups
- plot_contact_matrix(): Visualize contact matrices as heatmaps
- plot_spectral_radius(): Plot spectral radius of contact matrices over time

Example — Plotting simulation results:
\`\`\`python
from epydemix.visualization import plot_quantiles

df_quantiles = results.get_quantiles_compartments()
plot_quantiles(df_quantiles, columns=["I_total", "S_total", "R_total"])
\`\`\`

Example — Plotting transitions (new infections) over time:
\`\`\`python
df_quantiles_trans = results.get_quantiles_transitions()
plot_quantiles(df_quantiles_trans, columns=["S_to_I_total"])
\`\`\`

Example — Plotting posterior distributions after calibration:
\`\`\`python
from epydemix.visualization import plot_posterior_distribution, plot_posterior_distribution_2d

plot_posterior_distribution(calibration_results, param_name="beta")
plot_posterior_distribution_2d(calibration_results, param_names=["beta", "gamma"])
\`\`\`

Example — Plotting population and contact data:
\`\`\`python
from epydemix.visualization import plot_population, plot_contact_matrix

plot_population(population)
plot_contact_matrix(population, layer="home")
\`\`\`

All visualization functions use matplotlib under the hood.`,
    source: "Tutorial 01 + Tutorial 04 + PLOS paper" },

  { id: "simulation-results", title: "SimulationResults and Trajectory Objects", category: "api",
    tags: ["SimulationResults","Trajectory","results","output","quantiles","get_quantiles","get_quantiles_compartments","get_quantiles_transitions"],
    content: `Simulation outputs in Epydemix:

1. Trajectory: Output from a single simulation run (returned by simulate())
2. SimulationResults: Container for multiple simulation trajectories (returned by run_simulations())

SimulationResults methods:
- get_quantiles_compartments(): Get quantile statistics (median, CI) for compartment counts over time
- get_quantiles_transitions(): Get quantile statistics for transition counts over time

Column naming convention:
- Compartment columns: "{compartment}_total" (e.g., "I_total", "S_total", "R_total")
- Transition columns: "{source}_to_{target}_total" (e.g., "S_to_I_total")

When using multiprocessing, multiple SimulationResults objects can be merged by concatenating trajectories.`,
    source: "Tutorial 01 + Tutorial 10" },

  { id: "predefined-models", title: "Predefined Models", category: "api",
    tags: ["predefined","load_predefined_model","create_sir","create_seir","create_sis","SIS","SIR","SEIR","load","template","built-in"],
    content: `Epydemix provides predefined epidemic model templates:

\`\`\`python
from epydemix import load_predefined_model

model = load_predefined_model("SIR")
model = load_predefined_model("SEIR")
model = load_predefined_model("SIS")
\`\`\`

Internally, load_predefined_model() calls create_sir(), create_seir(), or create_sis().

These functions are in epydemix.model.predefined_models module. A ValueError is raised if the model_name is not recognized.

After loading a predefined model, you still need to set parameters and optionally load population data before running simulations.`,
    source: "ReadTheDocs API" },

  { id: "parameters", title: "Model Parameters", category: "api",
    tags: ["parameter","set_parameters","override_parameter","time-varying","beta","gamma","sigma","transmission","recovery","rate","incubation","infectious","period","R0","basic","reproduction"],
    content: `Parameters in Epydemix control transition rates. They can be:

1. Fixed values: Set at model creation or via parameters dict
\`\`\`python
model = EpiModel(parameters={"beta": 0.3, "gamma": 0.1})
\`\`\`

2. Named parameters in transitions: Referenced by string name
\`\`\`python
model.add_transition(source="S", target="I", params=("beta", "I"), kind="mediated")
\`\`\`

3. Time-varying parameters: Using override_parameter()
\`\`\`python
model.override_parameter(param_name="beta", value=0.1, start_date="2024-02-01", end_date="2024-03-01")
\`\`\`

4. Group-specific parameters: Parameters can vary across demographic groups

5. Mathematical expressions: Parameters can be combined using expressions like "beta*psi" in transition params

Common epidemiological parameters:
- beta (β): Transmission rate
- gamma (γ): Recovery rate — 1/gamma = average duration of infection
- sigma (σ): Incubation rate (SEIR) — 1/sigma = average latent period
- R0 (basic reproduction number): Not a direct parameter in Epydemix, but can be derived as beta/gamma for SIR`,
    source: "Tutorial 01 + Tutorial 03 + Tutorial 08 + PLOS paper" },

  { id: "initial-conditions", title: "Initial Conditions", category: "api",
    tags: ["initial","conditions","initial_conditions","percentage_in_agents","seed","infected","starting","I0","S0"],
    content: `Initial conditions in Epydemix control how many individuals start in each compartment.

Default behavior:
- If no initial conditions are specified, Epydemix places 0.05% (percentage_in_agents=0.0005) of the population in agent/infected compartments and the rest in source/susceptible compartments.

Custom initial conditions:
\`\`\`python
import numpy as np

initial_conditions = {
    "S": np.array([99900]),
    "I": np.array([100]),
    "R": np.array([0]),
}

results = model.run_simulations(
    start_date="2024-01-01",
    end_date="2024-04-10",
    initial_conditions_dict=initial_conditions,
    Nsim=100,
)
\`\`\`

For age-stratified models, the arrays should have one entry per age group.`,
    source: "Tutorial 01 + ReadTheDocs API" },

  { id: "multiple-strains", title: "Multiple Strains Modeling", category: "tutorial",
    tags: ["strain","multiple","variant","two","mutation","psi","reinfection","cross","immunity","competition"],
    content: `Epydemix can model multiple pathogen strains using extended compartmental structures.

Example (from Tutorial 08): Two-strain SIR model
\`\`\`python
from epydemix.model import EpiModel

model = EpiModel(compartments=["S", "I1", "I2", "R1", "R2"])

model.add_transition(source="S", target="I1", kind="mediated", params=("beta", "I1"))
model.add_transition(source="S", target="I2", kind="mediated", params=("beta*psi", "I2"))
model.add_transition(source="R1", target="I2", kind="mediated", params=("beta*psi*gamma", "I2"))
model.add_transition(source="I1", target="R1", kind="spontaneous", params="mu1")
model.add_transition(source="I2", target="R2", kind="spontaneous", params="mu2")
\`\`\`

Key concepts:
- psi: Relative transmissibility of strain 2 vs strain 1
- gamma: Relative susceptibility of R1 individuals to strain 2 (cross-immunity)

Time-delayed strain emergence can be modeled by overriding strain parameters to 0 during the initial period.`,
    source: "Tutorial 08" },

  { id: "vaccination", title: "Vaccination Modeling", category: "tutorial",
    tags: ["vaccination","vaccine","immunization","vaccinated","efficacy","campaign"],
    content: `Epydemix supports modeling vaccination strategies (Tutorial 09). Vaccination can be incorporated by:
- Adding vaccination-related compartments (e.g., V for vaccinated)
- Defining transitions from susceptible to vaccinated compartments
- Modeling reduced susceptibility for vaccinated individuals
- Time-varying vaccination rates using override_parameter()

Example structure for an SIR model with vaccination:
\`\`\`python
model = EpiModel(compartments=["S", "I", "R", "V"])

model.add_transition(source="S", target="I", params=("beta", "I"), kind="mediated")
model.add_transition(source="I", target="R", params="gamma", kind="spontaneous")
model.add_transition(source="S", target="V", params="nu", kind="spontaneous")
\`\`\`

Details are covered in Tutorial 09: Modeling Vaccinations.`,
    source: "Tutorial 09" },

  { id: "multiprocessing", title: "Multiprocessing for Speed", category: "tutorial",
    tags: ["multiprocessing","parallel","speed","performance","multiprocess","pool","CPU","cores","speedup"],
    content: `Epydemix simulations can be parallelized using the multiprocess package.

\`\`\`python
import multiprocess as mp

def run_chunk(n_sim):
    return model.run_simulations(start_date="2024-01-01", end_date="2024-12-31", Nsim=n_sim)

with mp.Pool(4) as pool:
    results_list = pool.map(run_chunk, [25, 25, 25, 25])

combined = results_list[0]
for r in results_list[1:]:
    combined.trajectories.extend(r.trajectories)
\`\`\`

This can achieve ~4x speedup on 4 CPU cores. Tutorial 10 covers both parallelized simulations and calibration.`,
    source: "Tutorial 10" },

  { id: "calibration-metrics", title: "Calibration Distance Metrics", category: "api",
    tags: ["metric","distance","rmse","wmape","calibration","error","loss","function","custom"],
    content: `Epydemix provides distance metrics in epydemix.calibration.metrics:

- rmse: Root Mean Square Error
- wmape: Weighted Mean Absolute Percentage Error

\`\`\`python
from epydemix.calibration import ABCSampler, rmse
from epydemix.calibration.metrics import wmape
\`\`\`

Users can also define custom distance functions — any callable that takes (simulated, observed) arrays and returns a scalar distance.`,
    source: "Tutorial 04 + Tutorial 07" },

  { id: "perturbation-kernels", title: "Perturbation Kernels for ABC-SMC", category: "api",
    tags: ["perturbation","kernel","SMC","Perturbation","custom","proposal"],
    content: `In ABC-SMC, perturbation kernels control how parameters are proposed in subsequent generations.

Defaults:
- Continuous parameters: Component-wise normal perturbation kernels (std = 2× empirical std from previous generation)
- Discrete parameters: Discrete jump transition kernels

Custom kernels can be created by extending the Perturbation abstract class from epydemix.utils:

\`\`\`python
from epydemix.utils import Perturbation
import numpy as np

class UniformPerturbation(Perturbation):
    def __init__(self, param_name, scale=0.1):
        super().__init__(param_name)
        self.scale = scale
    def perturb(self, value):
        return value + np.random.uniform(-self.scale, self.scale)
    def update(self, param_names, particles, weights):
        index = param_names.index(self.param_name)
\`\`\``,
    source: "Tutorial 05" },

  { id: "utilities", title: "Utility Functions", category: "api",
    tags: ["utils","utility","compute_simulation_dates","convert_to_2Darray","helper"],
    content: `Epydemix provides utility functions in epydemix.utils:

- compute_simulation_dates(): Compute the list of simulation dates
- convert_to_2Darray(): Convert data to 2D array format
- Perturbation: Abstract class for custom perturbation kernels

\`\`\`python
from epydemix.utils import compute_simulation_dates, convert_to_2Darray
\`\`\``,
    source: "Tutorial 07 + ReadTheDocs API" },

  { id: "installation", title: "Installation", category: "tutorial",
    tags: ["install","pip","conda","setup","requirements","dependency","version"],
    content: `Epydemix can be installed from PyPI or conda-forge:

From PyPI:
\`\`\`
pip install epydemix
\`\`\`

From conda-forge:
\`\`\`
conda install -c conda-forge epydemix
\`\`\`

Create a fresh environment:
\`\`\`
conda create -n epydemix-env -c conda-forge epydemix
conda activate epydemix-env
\`\`\``,
    source: "README" },

  { id: "covid-case-study", title: "COVID-19 Case Study", category: "tutorial",
    tags: ["COVID","COVID-19","case","study","Massachusetts","deaths","scenario","reopening","real","world","example","application"],
    content: `Tutorial 07 demonstrates a real-world COVID-19 case study modeling weekly deaths in Massachusetts during early 2020.

The workflow includes:
1. Importing epidemic data (weekly COVID-19 deaths from USAFacts)
2. Defining an SEIR-like epidemic model with death compartments
3. Loading population data for the target geography
4. Calibrating the model against observed death data using ABCSampler with wmape distance
5. Running scenario projections under different reopening strategies

Key imports used:
\`\`\`python
from epydemix.model import EpiModel, simulate
from epydemix.population import load_epydemix_population
from epydemix.visualization import plot_quantiles, plot_posterior_distribution, plot_posterior_distribution_2d
from epydemix.calibration import ABCSampler
from epydemix.calibration.metrics import wmape
from epydemix.utils import compute_simulation_dates, convert_to_2Darray
\`\`\``,
    source: "Tutorial 07 + PLOS paper" },

  { id: "advanced-features", title: "Advanced Modeling Features", category: "tutorial",
    tags: ["advanced","custom","transition","register_transition_kind","force","infection","nonlinear","frequency","dependent","density"],
    content: `Epydemix supports advanced modeling features (Tutorial 06):

1. Custom Transition Types: Using register_transition_kind()
\`\`\`python
def custom_transition_rate(model, source, target, params, state, dt, **kwargs):
    rate = ...
    return rate

model.register_transition_kind("custom_kind", custom_transition_rate)
model.add_transition(source="S", target="I", params=my_params, kind="custom_kind")
\`\`\`

2. Time-varying Parameters: Using override_parameter() for step-wise changes
3. Group-specific Parameters: Different values for different demographic groups
4. Custom Initial Conditions: Specifying exact initial populations per compartment
5. Mathematical Expressions in Parameters: String expressions like "beta*psi*gamma"`,
    source: "Tutorial 06 + PLOS paper" },

  { id: "calibration-results", title: "CalibrationResults Object", category: "api",
    tags: ["CalibrationResults","posterior","projection","results","calibration","get_posterior_distribution","run_projections"],
    content: `The CalibrationResults object is returned by ABCSampler.calibrate() and provides:

Properties:
- calibration_strategy, posterior_distributions, selected_trajectories
- observed_data, priors, calibration_params
- distances, weights (for SMC)
- projections, projection_parameters

Methods:
- get_calibration_quantiles(): Get quantile statistics from calibration
- get_calibration_trajectories(): Get selected trajectories
- get_distances(): Get distance values
- get_posterior_distribution(param_name): Get posterior for a specific parameter
- get_projection_quantiles(): Get quantile statistics from projections
- get_projection_trajectories(): Get projection trajectories

Projections:
\`\`\`python
abc_sampler.run_projections(nsamples=100, start_date="2024-06-01", end_date="2024-12-31")
\`\`\``,
    source: "ReadTheDocs API" },

  { id: "module-structure", title: "Package Module Structure", category: "api",
    tags: ["module","package","structure","import","organization","architecture"],
    content: `Epydemix package structure:

epydemix/
├── model/
│   ├── epimodel.py          # EpiModel class, simulate(), stochastic_simulation()
│   ├── predefined_models.py # create_sir(), create_seir(), create_sis(), load_predefined_model()
│   ├── simulation_output.py # Trajectory class
│   ├── simulation_results.py # SimulationResults class
│   └── transition.py        # Transition class
├── population/
│   └── population.py        # Population class, load_epydemix_population(), etc.
├── calibration/
│   ├── abc.py               # ABCSampler class
│   ├── calibration_results.py # CalibrationResults class
│   └── metrics.py           # rmse, wmape distance functions
├── visualization/           # plot_quantiles, plot_posterior_distribution, etc.
└── utils/                   # compute_simulation_dates, convert_to_2Darray, Perturbation

Key imports:
- from epydemix import EpiModel, simulate, load_predefined_model
- from epydemix.population import load_epydemix_population
- from epydemix.calibration import ABCSampler, rmse
- from epydemix.visualization import plot_quantiles`,
    source: "ReadTheDocs API" },

  { id: "compartmental-theory", title: "Compartmental Models Theory", category: "conceptual",
    tags: ["compartmental","theory","epidemiology","model","disease","spread","dynamics","R0","reproduction","number","herd","immunity","endemic","epidemic","outbreak"],
    content: `Compartmental models in Epydemix are based on classical epidemiological theory.

Core concepts:
- Individuals are grouped into compartments based on their epidemiological status
- Disease dynamics are modeled as transitions between compartments

Model types supported: SIR, SEIR, SIS, and custom models.

Key epidemiological quantities (derivable from model parameters but not directly built into Epydemix):
- R0 (basic reproduction number): For SIR, approximately beta/gamma × population contacts. Epydemix does not compute R0 directly.

Epydemix's stochastic approach means each simulation run produces different results. Multiple runs (Nsim) are needed to capture the distribution of outcomes.

Note: Epydemix models transitions stochastically using chain binomial draws, not deterministic ODEs.`,
    source: "PLOS paper + Tutorial 01" },

  { id: "contact-layers", title: "Contact Layers and Mixing", category: "conceptual",
    tags: ["contact","layer","home","work","school","community","mixing","matrix","age","stratified","Mistry"],
    content: `Contact matrices in Epydemix represent the average number of contacts between age groups in different settings.

Four standard contact layers: home, work, school, community

The overall contact matrix is the sum of all layer matrices. Contact matrices are age-stratified.

Data sources: mistry_2021 — synthetic contact matrices from Mistry et al. (2021), available for 400+ locations.

Contact layer manipulation for interventions:
\`\`\`python
model.add_interventions(start_date="2024-02-01", end_date="2024-03-01", layer="school", reduction=1.0)
\`\`\`

The spectral radius of the combined contact matrix is related to the basic reproduction number.`,
    source: "Tutorial 02 + Tutorial 03 + PLOS paper" },

  { id: "external-calibration", title: "External Model Calibration", category: "api",
    tags: ["external","model","calibration","custom","simulation","function","wrapper","outside","framework"],
    content: `Epydemix's ABCSampler can calibrate models built outside the Epydemix framework.

\`\`\`python
from epydemix.calibration import ABCSampler, rmse

def external_sim_func(params):
    result = my_external_model.run(beta=params["beta"], gamma=params["gamma"])
    return result.get_incidence()

abc_sampler = ABCSampler(
    priors=priors,
    distance_function=rmse,
    simulation_function=external_sim_func,
    observed_data=observed_data
)
\`\`\`

This design makes Epydemix's calibration module reusable beyond its own modeling framework.`,
    source: "PLOS paper" },

  { id: "projections", title: "Forward Projections", category: "api",
    tags: ["projection","forecast","scenario","forward","future","predict","run_projections"],
    content: `After calibrating a model, Epydemix supports running forward projections (scenario analysis).

\`\`\`python
calibration_results = abc_sampler.calibrate(strategy="smc", nparticles=1000, ngenerations=5)

abc_sampler.run_projections(nsamples=100, start_date="2024-06-01", end_date="2024-12-31")

from epydemix.visualization import plot_quantiles
df_proj = calibration_results.get_projection_quantiles()
plot_quantiles(df_proj, columns=["I_total"])
\`\`\`

Projections sample parameters from the calibrated posterior. Different scenarios can be explored by modifying contact patterns or parameters.`,
    source: "Tutorial 07 + PLOS paper + ReadTheDocs API" },
];

// ═══════════════════════════════════════════════════════════════════
// MODEL DEFINITIONS — Structured data for code generation
// ═══════════════════════════════════════════════════════════════════
const MODEL_DEFS = {
  SIR: { name: "SIR", fullName: "SIR (Susceptible-Infected-Recovered)", compartments: ["S","I","R"], transitions: [{ source:"S", target:"I", kind:"mediated", paramKey:"beta", mediator:"I", label:"Infection" },{ source:"I", target:"R", kind:"spontaneous", paramKey:"gamma", label:"Recovery" }], defaultParams: { beta:0.3, gamma:0.1 }, paramLabels: { beta:"Transmission rate (β)", gamma:"Recovery rate (γ)" }, plotColumns: ["S_total","I_total","R_total"] },
  SEIR: { name: "SEIR", fullName: "SEIR (Susceptible-Exposed-Infected-Recovered)", compartments: ["S","E","I","R"], transitions: [{ source:"S", target:"E", kind:"mediated", paramKey:"beta", mediator:"I", label:"Exposure" },{ source:"E", target:"I", kind:"spontaneous", paramKey:"sigma", label:"Incubation" },{ source:"I", target:"R", kind:"spontaneous", paramKey:"gamma", label:"Recovery" }], defaultParams: { beta:0.3, sigma:0.2, gamma:0.1 }, paramLabels: { beta:"Transmission rate (β)", sigma:"Incubation rate (σ)", gamma:"Recovery rate (γ)" }, plotColumns: ["S_total","E_total","I_total","R_total"] },
  SIS: { name: "SIS", fullName: "SIS (Susceptible-Infected-Susceptible)", compartments: ["S","I"], transitions: [{ source:"S", target:"I", kind:"mediated", paramKey:"beta", mediator:"I", label:"Infection" },{ source:"I", target:"S", kind:"spontaneous", paramKey:"gamma", label:"Recovery (no immunity)" }], defaultParams: { beta:0.3, gamma:0.1 }, paramLabels: { beta:"Transmission rate (β)", gamma:"Recovery rate (γ)" }, plotColumns: ["S_total","I_total"] },
};

// ═══════════════════════════════════════════════════════════════════
// PARAMETER EXTRACTION ENGINE
// ═══════════════════════════════════════════════════════════════════
function extractParams(question) {
  const params = {};
  // beta / transmission / infection rate
  for (const p of [/(?:transmission|infection|beta)\s*(?:rate)?[^0-9.]*?(\d+\.?\d*)/i, /(?:β)\s*[=:]?\s*(\d+\.?\d*)/i]) { const m = question.match(p); if (m) { params.beta = m[1]; break; } }
  // gamma / recovery / mu
  for (const p of [/(?:recovery|gamma|mu)\s*(?:rate)?[^0-9.]*?(\d+\.?\d*)/i, /(?:γ)\s*[=:]?\s*(\d+\.?\d*)/i]) { const m = question.match(p); if (m) { params.gamma = m[1]; break; } }
  // sigma / incubation / exposed / latent
  for (const p of [/(?:incubation|sigma|exposed|latent)\s*(?:rate|period)?[^0-9.]*?(\d+\.?\d*)/i, /(?:σ)\s*[=:]?\s*(\d+\.?\d*)/i]) { const m = question.match(p); if (m) { params.sigma = m[1]; break; } }
  // key=value patterns: beta=0.3, gamma=0.1, sigma=0.2
  for (const m of question.matchAll(/(\w+)\s*=\s*(\d+\.?\d*)/gi)) {
    const k = m[1].toLowerCase();
    if (k === "beta") params.beta = m[2];
    if (k === "gamma") params.gamma = m[2];
    if (k === "sigma") params.sigma = m[2];
  }
  // steps / days / duration
  for (const p of [/(\d+)\s*(?:time\s*)?steps/i, /(?:run\s+)?(?:for\s+)?(\d+)\s*(?:days?|time\s*steps?)/i, /(?:duration|period)\s*(?:of)?\s*(\d+)/i]) { const m = question.match(p); if (m) { params.steps = m[1]; break; } }
  if (!params.steps) { const m = question.match(/(?:run|simulate)\s+(?:for\s+|it\s+)?(\d+)/i); if (m) params.steps = m[1]; }
  // Nsim
  const nsimM = question.match(/(\d+)\s*(?:simulations?|runs?|iterations?)/i);
  if (nsimM) params.nsim = nsimM[1];
  // Country
  const countries = ["Italy","United States","United Kingdom","France","Germany","Spain","Brazil","India","China","Japan","Kenya","Nigeria","South Africa","Australia","Canada","Mexico","Argentina","Colombia","Russia","South Korea","Indonesia","Turkey","Egypt","Thailand","Netherlands","Sweden","Norway","Denmark","Finland","Switzerland","Austria","Belgium","Portugal","Greece","Poland","Czech Republic","Ireland","New Zealand","Singapore","Malaysia","Philippines","Vietnam","Pakistan","Bangladesh","Iran","Iraq","Saudi Arabia","Israel"];
  for (const c of countries) { if (question.toLowerCase().includes(c.toLowerCase())) { params.country = c; break; } }
  return params;
}

function detectModelType(question) {
  const q = question.toUpperCase();
  if (/\bSEIR\b/.test(q)) return "SEIR";
  if (/\bSIS\b/.test(q) && !/\bSIS(?:TER|T)\b/.test(q)) return "SIS";
  if (/\bSIR\b/.test(q)) return "SIR";
  const ql = question.toLowerCase();
  if (/exposed/.test(ql) && /susceptib/.test(ql)) return "SEIR";
  if (/susceptib.*infect.*susceptib/.test(ql)) return "SIS";
  if (/susceptib.*infect.*recover/.test(ql)) return "SIR";
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// CODE GENERATION ENGINE
// ═══════════════════════════════════════════════════════════════════
function generateModelCode(modelType, params, options = {}) {
  const def = MODEL_DEFS[modelType];
  if (!def) return null;
  const usedParams = { ...def.defaultParams };
  if (params.beta) usedParams.beta = parseFloat(params.beta);
  if (params.gamma) usedParams.gamma = parseFloat(params.gamma);
  if (params.sigma && def.defaultParams.sigma !== undefined) usedParams.sigma = parseFloat(params.sigma);
  const steps = parseInt(params.steps || "100");
  const nsim = parseInt(params.nsim || "100");
  const country = params.country || null;
  const endDate = new Date("2024-01-01"); endDate.setDate(endDate.getDate() + steps);
  const endDateStr = endDate.toISOString().split("T")[0];

  let code = "from epydemix import EpiModel\n";
  if (country) code += "from epydemix.population import load_epydemix_population\n";
  if (options.plot !== false) code += "from epydemix.visualization import plot_quantiles\n";
  code += `\n# Define ${def.fullName} model\nmodel = EpiModel(\n    name="${def.name} Model",\n    compartments=${JSON.stringify(def.compartments)},\n)\n\n# Add transitions\n`;
  for (const t of def.transitions) {
    const pv = usedParams[t.paramKey];
    if (t.kind === "mediated") code += `model.add_transition(source="${t.source}", target="${t.target}", params=(${pv}, "${t.mediator}"), kind="mediated")  # ${t.label}\n`;
    else code += `model.add_transition(source="${t.source}", target="${t.target}", params=${pv}, kind="spontaneous")  # ${t.label}\n`;
  }
  if (country) code += `\n# Load population data for ${country}\npopulation = load_epydemix_population("${country.replace(/\s/g,'_')}")\nmodel.set_population(population)\n`;
  code += `\n# Run ${nsim} stochastic simulations for ${steps} time steps\nresults = model.run_simulations(\n    start_date="2024-01-01",\n    end_date="${endDateStr}",\n    Nsim=${nsim},\n)\n`;
  if (options.plot !== false) code += `\n# Visualize results\ndf_quantiles = results.get_quantiles_compartments()\nplot_quantiles(df_quantiles, columns=${JSON.stringify(def.plotColumns)})\n`;

  let summary = "\n**Parameters used:**\n";
  for (const [key, label] of Object.entries(def.paramLabels)) { if (usedParams[key] !== undefined) summary += `- ${label}: ${usedParams[key]}\n`; }
  summary += `- Simulation duration: ${steps} time steps (daily, dt=1.0)\n- Number of simulations: ${nsim}\n`;
  if (country) summary += `- Population: ${country} (from epydemix-data)\n`;
  summary += "\n**Note:** Each time step defaults to 1 day (dt=1.0). The stochastic engine uses chain binomial sampling, so results will vary between runs.";
  return { code, summary, def, usedParams };
}

function generatePlotCode(question) {
  const q = question.toLowerCase();
  if (/posterior/i.test(q)) return { code: `from epydemix.visualization import plot_posterior_distribution, plot_posterior_distribution_2d\n\n# After calibration: calibration_results = abc_sampler.calibrate(...)\nplot_posterior_distribution(calibration_results, param_name="beta")\nplot_posterior_distribution_2d(calibration_results, param_names=["beta", "gamma"])`, explanation: "This plots posterior distributions from calibration. You need a CalibrationResults object from a prior calibration run." };
  if ((/population|demographic|age\s*distribution/i.test(q)) && /plot|visual|show|draw|display/i.test(q)) return { code: `from epydemix.population import load_epydemix_population\nfrom epydemix.visualization import plot_population, plot_contact_matrix\n\npopulation = load_epydemix_population("Italy")\nplot_population(population)\nplot_contact_matrix(population, layer="home")\nplot_contact_matrix(population, layer="school")`, explanation: "This plots the population age distribution and contact matrices. Replace 'Italy' with any supported country." };
  if (/contact\s*matrix|heatmap/i.test(q)) return { code: `from epydemix.population import load_epydemix_population\nfrom epydemix.visualization import plot_contact_matrix\n\npopulation = load_epydemix_population("Italy")\nfor layer in ["home", "work", "school", "community"]:\n    plot_contact_matrix(population, layer=layer)`, explanation: "This visualizes age-stratified contact matrices as heatmaps for each social setting." };
  if (/spectral\s*radius/i.test(q)) return { code: `from epydemix.visualization import plot_spectral_radius\n\nplot_spectral_radius(model, start_date="2024-01-01", end_date="2024-06-01")`, explanation: "This plots the spectral radius of the contact matrix over time." };
  if (/transition|incidence|new\s*(?:infection|case)/i.test(q)) { const mt = detectModelType(question) || "SIR"; const def = MODEL_DEFS[mt]; const tc = `${def.transitions[0].source}_to_${def.transitions[0].target}_total`; return { code: `from epydemix.visualization import plot_quantiles\n\n# After running simulations: results = model.run_simulations(...)\ndf_transitions = results.get_quantiles_transitions()\nplot_quantiles(df_transitions, columns=["${tc}"])`, explanation: "This plots new transitions (e.g., new infections) per time step with confidence intervals." }; }
  // Default: compartment plot
  const mt = detectModelType(question) || "SIR"; const def = MODEL_DEFS[mt];
  return { code: `from epydemix.visualization import plot_quantiles\n\n# After running simulations: results = model.run_simulations(...)\ndf_quantiles = results.get_quantiles_compartments()\nplot_quantiles(df_quantiles, columns=${JSON.stringify(def.plotColumns)})\n\n# Plot only the infected curve\nplot_quantiles(df_quantiles, columns=["I_total"])`, explanation: "This uses Epydemix's plot_quantiles() to plot compartment counts with median and confidence intervals." };
}

function generateCalibrationCode(question) {
  const mt = detectModelType(question) || "SIR"; const def = MODEL_DEFS[mt];
  let strategy = "smc";
  if (/rejection/i.test(question)) strategy = "rejection";
  if (/top.?fraction/i.test(question)) strategy = "top_fraction";
  let code = `from epydemix import EpiModel\nfrom epydemix.population import load_epydemix_population\nfrom epydemix.calibration import ABCSampler, rmse\nfrom epydemix.visualization import plot_quantiles, plot_posterior_distribution\nfrom scipy import stats\nimport pandas as pd\n\n# 1. Define the ${def.name} model\nmodel = EpiModel(name="${def.name} Model", compartments=${JSON.stringify(def.compartments)})\n`;
  for (const t of def.transitions) { if (t.kind==="mediated") code += `model.add_transition(source="${t.source}", target="${t.target}", params=("${t.paramKey}", "${t.mediator}"), kind="mediated")\n`; else code += `model.add_transition(source="${t.source}", target="${t.target}", params="${t.paramKey}", kind="spontaneous")\n`; }
  code += `\n# 2. Load population data\npopulation = load_epydemix_population("United_States")\nmodel.set_population(population)\n\n# 3. Load observed data (replace with your data)\nobserved_data = pd.read_csv("your_data.csv")\n\n# 4. Define priors\npriors = {\n`;
  for (const key of Object.keys(def.defaultParams)) code += `    "${key}": stats.uniform(loc=0.01, scale=0.5),\n`;
  code += `}\n\n# 5. Define simulation function\ndef sim_func(params):\n    for key, val in params.items():\n        model.parameters[key] = val\n    results = model.run_simulations(start_date="2024-01-01", end_date="2024-06-01", Nsim=1)\n    return results.get_quantiles_transitions()\n\n# 6. Create sampler and calibrate\nabc_sampler = ABCSampler(\n    priors=priors,\n    distance_function=rmse,\n    simulation_function=sim_func,\n    observed_data=observed_data,\n)\n\n`;
  if (strategy==="rejection") code += `calibration_results = abc_sampler.calibrate(strategy="rejection", nparticles=1000, tolerance=550000)\n`;
  else if (strategy==="top_fraction") code += `calibration_results = abc_sampler.calibrate(strategy="top_fraction", nsim=10000, top_fraction=0.1)\n`;
  else code += `calibration_results = abc_sampler.calibrate(strategy="smc", nparticles=1000, ngenerations=5)\n`;
  code += `\n# 7. Visualize results\nplot_posterior_distribution(calibration_results, param_name="${Object.keys(def.defaultParams)[0]}")\ndf_cal = calibration_results.get_calibration_quantiles()\nplot_quantiles(df_cal, columns=["I_total"])`;
  return code;
}

function generateInterventionCode(question) {
  const q = question.toLowerCase(); const mt = detectModelType(question) || "SIR"; const params = extractParams(question);
  let layer = "school"; if (/work/i.test(q)) layer = "work"; if (/communit/i.test(q)) layer = "community"; if (/home/i.test(q)) layer = "home";
  let reduction = "0.8"; const rm = question.match(/(?:reduc\w*|by)\s*(\d+)\s*%/i); if (rm) reduction = (parseInt(rm[1])/100).toString(); const rm2 = question.match(/(?:reduction|factor)\s*(?:of|=)?\s*(0\.\d+)/i); if (rm2) reduction = rm2[1];
  const def = MODEL_DEFS[mt]; const country = params.country || "Italy";
  let code = `from epydemix import EpiModel\nfrom epydemix.population import load_epydemix_population\nfrom epydemix.visualization import plot_quantiles\n\nmodel = EpiModel(name="${def.name} Model", compartments=${JSON.stringify(def.compartments)})\n`;
  for (const t of def.transitions) { if (t.kind==="mediated") code += `model.add_transition(source="${t.source}", target="${t.target}", params=(${def.defaultParams[t.paramKey]}, "${t.mediator}"), kind="mediated")\n`; else code += `model.add_transition(source="${t.source}", target="${t.target}", params=${def.defaultParams[t.paramKey]}, kind="spontaneous")\n`; }
  code += `\npopulation = load_epydemix_population("${country.replace(/\s/g,'_')}")\nmodel.set_population(population)\n\n# Add intervention: ${layer} closure with ${parseFloat(reduction)*100}% reduction\nmodel.add_interventions(\n    start_date="2024-02-01",\n    end_date="2024-03-01",\n    layer="${layer}",\n    reduction=${reduction},\n)\n\nresults = model.run_simulations(start_date="2024-01-01", end_date="2024-06-01", Nsim=100)\n\ndf_quantiles = results.get_quantiles_compartments()\nplot_quantiles(df_quantiles, columns=${JSON.stringify(def.plotColumns)})`;
  return code;
}

// ═══════════════════════════════════════════════════════════════════
// RAG PIPELINE — CLASSIFIER, RETRIEVER, JUDGE, ROUTER
// ═══════════════════════════════════════════════════════════════════

function classifyQuestion(question) {
  const q = question.toLowerCase();
  // Imperative start = code request
  if (/^(create|build|write|make|run|simulate|plot|show|draw|visualize|generate|set|calibrate|implement|define|give)\b/i.test(q.trim())) return "non-conceptual";
  // Contains param=value AND model keyword = code request
  if (/(?:=|equal\s+to|set\s+to|of)\s*\d+\.?\d*/i.test(q) && /model|sir|seir|sis|simulat/i.test(q)) return "non-conceptual";
  // Bare model name with params = code
  if (/\b(sir|seir|sis)\b/i.test(q) && /\d+\.?\d*/.test(q) && /(?:beta|gamma|sigma|transmission|recovery|incubation|rate|step|day)/i.test(q)) return "non-conceptual";

  const codeSignals = ["create","build","write","code","implement","make a","script","example","show me code","show code","give me code","set up","configure","plot","chart","graph","visualize","draw","display","modify","change","update","edit","fix","generate","produce","simulate","model for","how do i","how to ","how can i","calibrate this","run this","help me with"];
  const conceptSignals = ["what is","what does","what are","what's","explain","describe","tell me about","how does","how works","how is","why","purpose","represent","meaning","concept","difference between","compare","vs","theory","overview","introduction","define","internally","under the hood","behind","principle","can epydemix","does epydemix","is epydemix","which","when should","advantages","disadvantages","limitation","support","capable"];
  const hasCode = codeSignals.some(s => q.includes(s));
  const hasConcept = conceptSignals.some(s => q.includes(s));
  if (hasConcept && !hasCode) return "conceptual";
  if (hasCode && !hasConcept) return "non-conceptual";
  if (hasConcept && hasCode) { if (/how\s+(do|can)\s+i/i.test(q)) return "non-conceptual"; return "conceptual"; }
  if (q.includes("?")) return "conceptual";
  return "non-conceptual";
}

function tokenize(text) { return text.toLowerCase().replace(/[^a-z0-9_]/g," ").split(/\s+/).filter(t => t.length > 1 && !["the","and","for","this","that","with","from","what","how","does","can","are","is","it","to","in","of","a","an","on","at","by"].includes(t)); }

function retrieve(question, topK = 5) {
  const qTokens = tokenize(question); const qLower = question.toLowerCase();
  const scored = KNOWLEDGE_BASE.map(doc => {
    let score = 0;
    const docText = (doc.title + " " + doc.content + " " + doc.tags.join(" ")).toLowerCase();
    for (const tag of doc.tags) { const tl = tag.toLowerCase(); if (qLower.includes(tl)) score += tl.length > 3 ? 10 : 5; }
    const titleTokens = tokenize(doc.title); for (const tt of titleTokens) { if (qLower.includes(tt)) score += 5; }
    for (const qt of qTokens) { if (docText.includes(qt)) score += 2; const re = new RegExp(`\\b${qt}\\b`,"i"); if (re.test(docText)) score += 1; }
    for (let i = 0; i < qTokens.length-1; i++) { if (docText.includes(qTokens[i]+" "+qTokens[i+1])) score += 8; }
    const boosts = [
      {p:/epimodel\s*(class)?/i,id:"epimodel-class",b:20},{p:/what\s*(does|is)\s*.*epimodel/i,id:"epimodel-represents",b:25},
      {p:/\bseir\b/i,id:"seir-model",b:20},{p:/\bsir\b/i,id:"sir-model",b:20},{p:/\bsis\b/i,id:"sis-model",b:20},
      {p:/calibrat/i,id:"calibration",b:20},{p:/gradient\s*descent/i,id:"calibration",b:25},
      {p:/\bode\b|solver|integrat|numerical/i,id:"stochastic-engine",b:25},
      {p:/populat|contact\s*matrix|demographic|country|age.?group|available.*location/i,id:"population",b:15},
      {p:/transit/i,id:"transitions",b:15},{p:/simulat|run.*model/i,id:"simulation",b:12},
      {p:/plot|visual|chart|graph|figure|draw|display/i,id:"visualization",b:15},
      {p:/interventi|npi|closure|lockdown|school\s*clos|quarantin/i,id:"interventions",b:20},
      {p:/strain|variant|mutation|multi.*strain/i,id:"multiple-strains",b:20},{p:/vaccin/i,id:"vaccination",b:20},
      {p:/multiprocess|parallel|speed/i,id:"multiprocessing",b:20},{p:/install|pip|conda/i,id:"installation",b:20},
      {p:/covid|massachusetts|case\s*study/i,id:"covid-case-study",b:20},{p:/predefin|load_predefined/i,id:"predefined-models",b:20},
      {p:/perturbat|kernel/i,id:"perturbation-kernels",b:20},{p:/CalibrationResult|posterior/i,id:"calibration-results",b:15},
      {p:/initial\s*condition|seed|I0|S0|percentage_in_agents/i,id:"initial-conditions",b:20},
      {p:/contact\s*layer|home|work|school|community.*contact/i,id:"contact-layers",b:18},
      {p:/external\s*model|outside.*framework/i,id:"external-calibration",b:20},
      {p:/project|forecast|scenario/i,id:"projections",b:18},
      {p:/compartmental\s*model|R0|reproduction\s*number|herd\s*immunit/i,id:"compartmental-theory",b:18},
      {p:/SimulationResults|Trajectory|get_quantiles/i,id:"simulation-results",b:18},
      {p:/module|package\s*structure|import|architecture/i,id:"module-structure",b:12},
      {p:/distance|metric|rmse|wmape|loss/i,id:"calibration-metrics",b:18},
      {p:/advanced|register_transition_kind|custom\s*transition|frequency.?dependent|density.?dependent/i,id:"advanced-features",b:18},
      {p:/parameter|beta|gamma|sigma|override|time.?varying/i,id:"parameters",b:12},
    ];
    for (const b of boosts) { if (b.p.test(question) && doc.id === b.id) score += b.b; }
    return { doc, score };
  });
  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0, topK).filter(s => s.score > 0);
}

function judgeEvidence(results) { if (results.length === 0) return "none"; const s = results[0].score; if (s >= 18) return "exact"; if (s >= 6) return "partial"; return "none"; }

// ═══════════════════════════════════════════════════════════════════
// INTENT DETECTION — FIXED: "show me example" ≠ "plot"
// ═══════════════════════════════════════════════════════════════════
function detectIntent(question) {
  const q = question.toLowerCase();

  // 1. CALIBRATION — check BEFORE plot because "show me calibration" is calibrate not plot
  if (/(?:calibrate|fit)\s+(?:a|an|the|my|this)?\s*(?:model|sir|seir|sis)/i.test(q)) return "calibrate";
  if (/how\s+(?:do\s+i|to|can\s+i)\s+calibrate/i.test(q)) return "calibrate";
  if (/(?:write|show|give)\s+(?:me\s+)?(?:code|example|an\s+example)\s+(?:for|of)\s+calibrat/i.test(q)) return "calibrate";
  if (/(?:show|give)\s+(?:me\s+)?.*calibrat/i.test(q) && !/plot/i.test(q)) return "calibrate";
  if (/calibrat.*(?:code|example|workflow|how)/i.test(q)) return "calibrate";

  // 2. INTERVENTION — check before plot
  if (/(?:add|model|simulate|implement)\s+(?:a\s+|an?\s+)?(?:intervention|npi|lockdown|closure|school\s*closure|quarantine)/i.test(q)) return "intervention";
  if (/how\s+(?:do\s+i|to|can\s+i)\s+(?:add|model|simulate)\s+(?:a\s+|an?\s+)?(?:intervention|npi|lockdown|closure)/i.test(q)) return "intervention";
  if (/(?:school|work|workplace)\s*clos/i.test(q) && /(?:model|simulat|code|how|impact|effect)/i.test(q)) return "intervention";
  if (/(?:impact|effect)\s+of\s+(?:school|work|lockdown|clos|quarantine|intervention|npi)/i.test(q)) return "intervention";
  if (/how\s+(?:can|do|to)\s+.*(?:model|simulat)\s+.*(?:closure|lockdown|intervention|npi)/i.test(q)) return "intervention";

  // 3. CREATE MODEL — imperative or parameterized
  if (/^(create|build|write|make|run|simulate|implement|define|set\s*up)\b/i.test(q.trim())) return "create-model";
  if (/(?:create|build|make|write|implement|define)\s+(?:a\s+|an?\s+)?(?:sir|seir|sis|epidemic|compartmental)/i.test(q)) return "create-model";
  if (/(?:sir|seir|sis)\s+model\s+(?:for|with|setting|where)/i.test(q)) return "create-model";
  if (/(?:=|equal\s+to|set\s+to)\s*\d/i.test(q) && /(?:sir|seir|sis|model|simulat)/i.test(q)) return "create-model";
  // Bare model with numeric params = create
  if (/\b(sir|seir|sis)\b/i.test(q) && /\d+\.?\d*/.test(q) && /(?:beta|gamma|sigma|transmission|recovery|incubation|rate|step|day)/i.test(q)) return "create-model";
  // "I want to create/run/simulate..."
  if (/(?:i\s+want\s+to|i\s+need\s+to|can\s+you)\s+(?:create|build|make|run|simulate)/i.test(q)) return "create-model";

  // 4. PLOT — but NOT "show me an example of X" (that's X, not plot)
  if (/^(plot|draw|visualize|chart|graph)\b/i.test(q.trim())) return "plot";
  if (/(?:plot|draw|visualize|graph|chart)\s+(?:the|a|an)?\s*(?:result|simulation|compartment|infection|curve|epidemic|posterior|population|contact|transition|incidence)/i.test(q)) return "plot";
  if (/how\s+(?:do\s+i|to|can\s+i)\s+(?:plot|visualize|graph|chart|draw|display)/i.test(q)) return "plot";
  if (/^(show|display)\b/i.test(q.trim()) && /(?:plot|curve|graph|chart|result|infection|compartment|posterior|population|contact)/i.test(q)) return "plot";
  if (/help\s+(?:me\s+)?(?:with\s+)?(?:plot|visual|graph|chart)/i.test(q)) return "plot";

  // 5. COMPARISON
  if (/(?:difference|compare|vs|versus)\s+(?:between|of)?/i.test(q)) return "compare";
  if (/\bsir\b.*\bvs\b.*\bseir\b|\bseir\b.*\bvs\b.*\bsir\b/i.test(q)) return "compare";

  // 6. Default
  return "conceptual";
}

// ═══════════════════════════════════════════════════════════════════
// ANSWER GENERATION — Policy Router
// ═══════════════════════════════════════════════════════════════════
function generateAnswer(question, questionType, evidence, results) {
  const topDocs = results.slice(0,4).map(r => r.doc);
  const intent = detectIntent(question);

  // ─── NONE + NON-CONCEPTUAL: refuse honestly ─────────────────
  if (evidence === "none" && questionType === "non-conceptual") {
    return { answer: "This is not covered in the Epydemix tutorials or documentation. I cannot generate code for this because there is no grounding in the official sources, and generating unverified code could lead to incorrect results.\n\nPlease check the official documentation at https://epydemix.readthedocs.io/ or the GitHub repository at https://github.com/epistorm/epydemix", sources: [], pipeline: { questionType, evidence, policy: "none + non-conceptual → honest refusal" } };
  }

  // ─── NONE + CONCEPTUAL: say what we DO know ────────────────
  if (evidence === "none" && questionType === "conceptual") {
    return { answer: "The Epydemix documentation does not contain specific information about this topic. Here is what I can confirm based on the official sources:\n\nEpydemix is a Python package for stochastic compartmental epidemic modeling. It supports:\n- Defining compartmental models (SIR, SEIR, SIS, and custom structures)\n- Stochastic simulation using a chain binomial approach (not deterministic ODEs)\n- Age-stratified population data and contact matrices for 400+ regions\n- Calibration via Approximate Bayesian Computation (ABC) — not gradient-based optimization\n- Non-pharmaceutical intervention modeling\n- Visualization of results, posteriors, and contact matrices\n\nIf your question is about a topic beyond what's covered in the Epydemix documentation, I cannot provide an answer because I could only speculate, which risks hallucination.\n\nFor more information: https://epydemix.readthedocs.io/ or https://github.com/epistorm/epydemix/tree/main/tutorials", sources: [], pipeline: { questionType, evidence, policy: "none + conceptual → controlled fallback" } };
  }

  // ─── From here: evidence is "exact" or "partial" ───────────
  const sources = topDocs.slice(0,3).map(d => ({ title: d.title, source: d.source }));

  // ─── CREATE-MODEL intent ───────────────────────────────────
  if (intent === "create-model") {
    const mt = detectModelType(question);
    if (mt) {
      const params = extractParams(question);
      const gen = generateModelCode(mt, params);
      if (gen) return { answer: `Here's how to create and run this ${gen.def.fullName} model in Epydemix:\n\n\`\`\`python\n${gen.code}\`\`\`\n${gen.summary}`, sources, pipeline: { questionType: "non-conceptual", evidence, policy: `${evidence} + create-model → grounded code` } };
    }
    // Model type not detected but intent is create — give doc-based answer
    return { answer: buildAnswerFromDocs(question, topDocs, evidence), sources, pipeline: { questionType, evidence, policy: `${evidence} + ${questionType}` } };
  }

  // ─── PLOT intent ───────────────────────────────────────────
  if (intent === "plot") {
    const pr = generatePlotCode(question);
    let answer = `Here's how to create this visualization in Epydemix:\n\n\`\`\`python\n${pr.code}\n\`\`\`\n\n${pr.explanation}`;
    // If they also want to create and plot
    const mt = detectModelType(question);
    if (mt && /(?:create|build|make|run|simulat)/i.test(question)) {
      const params = extractParams(question);
      const gen = generateModelCode(mt, params, { plot: false });
      if (gen) answer = `Here's the complete code to create the ${gen.def.fullName} model and plot the results:\n\n\`\`\`python\n${gen.code}\n\n# Plot results\ndf_quantiles = results.get_quantiles_compartments()\nplot_quantiles(df_quantiles, columns=${JSON.stringify(gen.def.plotColumns)})\n\`\`\`\n${gen.summary}`;
    }
    return { answer, sources, pipeline: { questionType: "non-conceptual", evidence, policy: `${evidence} + plot → plot code generation` } };
  }

  // ─── CALIBRATE intent ──────────────────────────────────────
  if (intent === "calibrate") {
    const code = generateCalibrationCode(question);
    return { answer: `Here's a complete calibration workflow in Epydemix:\n\n\`\`\`python\n${code}\n\`\`\`\n\n**Important notes:**\n- Replace "your_data.csv" with your actual observed data file\n- Adjust the priors based on your domain knowledge\n- The simulation function wrapper must return data in the same format as your observed data\n- Epydemix uses ABC (Approximate Bayesian Computation), NOT gradient descent\n- Three strategies available: "rejection", "top_fraction", and "smc" (recommended for best accuracy)`, sources, pipeline: { questionType: "non-conceptual", evidence, policy: `${evidence} + calibrate → calibration code` } };
  }

  // ─── INTERVENTION intent ───────────────────────────────────
  if (intent === "intervention") {
    const code = generateInterventionCode(question);
    return { answer: `Here's how to model interventions in Epydemix:\n\n\`\`\`python\n${code}\n\`\`\`\n\n**Notes:**\n- add_interventions() modifies contact matrices for specific layers (home, work, school, community)\n- override_parameter() can change any model parameter during specific time periods\n- Reduction of 1.0 = complete closure, 0.5 = 50% reduction in contacts`, sources, pipeline: { questionType: "non-conceptual", evidence, policy: `${evidence} + intervention → intervention code` } };
  }

  // ─── CONCEPTUAL / COMPARISON / GENERAL ─────────────────────
  return { answer: buildAnswerFromDocs(question, topDocs, evidence), sources, pipeline: { questionType, evidence, policy: `${evidence} + ${questionType}` } };
}

// ═══════════════════════════════════════════════════════════════════
// ANSWER BUILDER — constructs answers from retrieved documents
// ═══════════════════════════════════════════════════════════════════
function buildAnswerFromDocs(question, docs, evidence) {
  // ── Anti-hallucination traps ───────────────────────────────
  if (/gradient\s*descent/i.test(question) && /calibrat|optimi|parameter/i.test(question)) {
    const d = docs.find(d=>d.id==="calibration") || KNOWLEDGE_BASE.find(d=>d.id==="calibration");
    if (d) return d.content + "\n\n⚠️ **Important clarification:** Epydemix does NOT use gradient descent for calibration or parameter optimization. It uses simulation-based Approximate Bayesian Computation (ABC) methods, which do not require computing gradients or a differentiable likelihood function.";
  }
  if (/\bode\b|solver|numerical|integrat|differential\s*equation|runge|kutta|euler/i.test(question)) {
    const d = docs.find(d=>d.id==="stochastic-engine") || KNOWLEDGE_BASE.find(d=>d.id==="stochastic-engine");
    if (d) return d.content;
  }

  // ── Special conceptual handlers ────────────────────────────
  if (/what\s*(does|is)\s*.*epimodel\s*(class)?\s*(represent)?/i.test(question)) { const d = docs.find(d=>d.id==="epimodel-represents")||docs.find(d=>d.id==="epimodel-class"); if (d) return d.content; }
  if (/what\s*(?:is|are)\s*.*\bseir\b/i.test(question)) { const d = docs.find(d=>d.id==="seir-model"); if (d) return d.content; }
  if (/what\s*(?:is|are)\s*.*\bsis\b/i.test(question) && !/sister/i.test(question)) { const d = docs.find(d=>d.id==="sis-model"); if (d) return d.content; }
  if (/what\s*(?:is|are)\s*.*\bsir\b/i.test(question) || /\bsir\s*model\b/i.test(question)) { const d = docs.find(d=>d.id==="sir-model"); if (d) return d.content; }
  if (/calibrat/i.test(question)) { const d = docs.find(d=>d.id==="calibration"); if (d) return d.content; }

  // ── Comparison questions ───────────────────────────────────
  if (/(?:difference|compare|vs|versus)\s+(?:between)?/i.test(question)) {
    const models = []; if (/\bsir\b/i.test(question)) models.push("sir-model"); if (/\bseir\b/i.test(question)) models.push("seir-model"); if (/\bsis\b/i.test(question)) models.push("sis-model");
    if (/rejection|smc|top.?fraction/i.test(question)) { const d = docs.find(d=>d.id==="calibration"); if (d) return d.content; }
    if (models.length >= 2) { let ans = "Here is a comparison based on the Epydemix documentation:\n\n"; for (const mid of models) { const d = KNOWLEDGE_BASE.find(d=>d.id===mid); if (d) ans += `**${d.title}**\n${d.content}\n\n---\n\n`; } return ans; }
  }

  // ── Visualization overview ─────────────────────────────────
  if (/what\s+(?:plot|visual|chart|graph)/i.test(question)||/(?:plot|visual)\s+(?:option|tool|function|capabilit)/i.test(question)) { const d = docs.find(d=>d.id==="visualization"); if (d) return d.content; }

  // ── Partial evidence: synthesize honestly ──────────────────
  if (evidence === "partial") {
    let ans = "Based on the available Epydemix documentation, here is what I can tell you:\n\n"; const seen = new Set();
    for (const doc of docs) { if (!seen.has(doc.id)) { seen.add(doc.id); ans += doc.content + "\n\n"; } }
    ans += "*Note: This answer is synthesized from partial matches in the documentation. For complete details, consult the official Epydemix documentation.*";
    return ans;
  }

  // ── Exact evidence: best doc + supplementary if relevant ───
  const primary = docs[0]; if (!primary) return "No matching documentation found.";
  if (docs.length > 1 && docs[1] && docs[0].id !== docs[1].id) {
    const q2T = tokenize(question); const d1T = (docs[1].title+" "+docs[1].tags.join(" ")).toLowerCase();
    if (q2T.filter(t=>d1T.includes(t)).length >= 2) return primary.content + "\n\n---\n\n**Additional relevant information:**\n\n" + docs[1].content;
  }
  return primary.content;
}

// ═══════════════════════════════════════════════════════════════════
// FULL RAG PIPELINE
// ═══════════════════════════════════════════════════════════════════
function ragPipeline(question) {
  const questionType = classifyQuestion(question);
  const results = retrieve(question);
  const evidence = judgeEvidence(results);
  return generateAnswer(question, questionType, evidence, results);
}

// ═══════════════════════════════════════════════════════════════════
// REACT UI — UNCHANGED
// ═══════════════════════════════════════════════════════════════════
const EXAMPLE_QUESTIONS = [
  "What does the EpiModel class represent?",
  "What is the SEIR model in Epydemix?",
  "Create a SIR model for Italy setting transmission rate equal to 0.2 and recovery rate equal to 0.1 run for 100 time steps",
  "Create a SEIR model with beta=0.4, sigma=0.2, gamma=0.1 for United States run for 200 time steps",
  "Create a SIS model with beta=0.3 and gamma=0.15 run for 50 time steps",
  "Plot the infection curve for an SIR simulation",
  "How do I calibrate a model against observed data?",
  "How does calibration work and how does it optimize parameters using gradient descent?",
  "What numerical solver does Epydemix use internally for ODE integration?",
  "How can I model the impact of school closures on disease spread?",
];

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false), 2000); };
  return (<div style={{position:"relative",background:"#0d1117",borderRadius:8,margin:"12px 0",overflow:"hidden",border:"1px solid #30363d"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 12px",background:"#161b22",borderBottom:"1px solid #30363d",fontSize:11,color:"#8b949e",fontFamily:"'JetBrains Mono', 'Fira Code', monospace"}}><span>python</span><button onClick={handleCopy} style={{background:"none",border:"1px solid #30363d",color:"#8b949e",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{copied?"✓ Copied":"Copy"}</button></div><pre style={{margin:0,padding:"12px 16px",overflowX:"auto",fontSize:13,lineHeight:1.5,color:"#e6edf3",fontFamily:"'JetBrains Mono', 'Fira Code', monospace"}}><code>{code}</code></pre></div>);
}

function FormattedContent({ text }) {
  const parts = text.split(/(```python\n[\s\S]*?```|```\n[\s\S]*?```)/g);
  return (<>{parts.map((part,i) => {
    if (part.startsWith("```")) { const code = part.replace(/^```(?:python)?\n?/,"").replace(/\n?```$/,""); return <CodeBlock key={i} code={code} />; }
    const lines = part.split("\n");
    return (<div key={i}>{lines.map((line,j) => {
      if (line.startsWith("⚠️")||line.startsWith("**Important")) return (<div key={j} style={{background:"#332b00",border:"1px solid #664d00",borderRadius:6,padding:"10px 14px",margin:"10px 0",fontSize:13.5,lineHeight:1.55,color:"#ffd666"}}>{renderInline(line)}</div>);
      if (line.startsWith("- ")) return (<div key={j} style={{paddingLeft:16,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:4,color:"#58a6ff"}}>•</span>{renderInline(line.slice(2))}</div>);
      if (/^\d+\.\s/.test(line)) { const num = line.match(/^(\d+)\./)[1]; return (<div key={j} style={{paddingLeft:20,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:0,color:"#58a6ff",fontWeight:600}}>{num}.</span>{renderInline(line.replace(/^\d+\.\s*/,""))}</div>); }
      if (line.trim()==="---") return <hr key={j} style={{border:"none",borderTop:"1px solid #1e293b",margin:"12px 0"}} />;
      if (line.trim()==="") return <div key={j} style={{height:8}} />;
      return <div key={j} style={{marginBottom:2}}>{renderInline(line)}</div>;
    })}</div>);
  })}</>);
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p,i) => {
    if (p.startsWith("**")&&p.endsWith("**")) return <strong key={i} style={{color:"#e2e8f0",fontWeight:600}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("*")&&p.endsWith("*")&&!p.startsWith("**")) return <em key={i} style={{color:"#94a3b8"}}>{p.slice(1,-1)}</em>;
    if (p.startsWith("`")&&p.endsWith("`")) return (<code key={i} style={{background:"#1e293b",color:"#7dd3fc",padding:"1px 5px",borderRadius:3,fontSize:"0.9em",fontFamily:"'JetBrains Mono', 'Fira Code', monospace"}}>{p.slice(1,-1)}</code>);
    return <span key={i}>{p}</span>;
  });
}

function PipelineBadge({ pipeline }) {
  const colors = { conceptual:{bg:"#1e3a5f",color:"#7dd3fc",border:"#2563eb"}, "non-conceptual":{bg:"#3b1f4a",color:"#d8b4fe",border:"#7c3aed"}, exact:{bg:"#064e3b",color:"#6ee7b7",border:"#059669"}, partial:{bg:"#713f12",color:"#fde68a",border:"#d97706"}, none:{bg:"#4a1515",color:"#fca5a5",border:"#dc2626"} };
  const qType = colors[pipeline.questionType]||colors.conceptual;
  const evType = colors[pipeline.evidence]||colors.none;
  return (<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10,paddingTop:10,borderTop:"1px solid #1e293b"}}>
    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:qType.bg,color:qType.color,border:`1px solid ${qType.border}`,fontFamily:"'JetBrains Mono', monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>{pipeline.questionType}</span>
    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:evType.bg,color:evType.color,border:`1px solid ${evType.border}`,fontFamily:"'JetBrains Mono', monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>evidence: {pipeline.evidence}</span>
    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",fontFamily:"'JetBrains Mono', monospace"}}>{pipeline.policy}</span>
  </div>);
}

export default function EpydemixRAGChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  const handleSend = useCallback((text) => {
    const q = (text || input).trim(); if (!q) return;
    setMessages(prev => [...prev, { role: "user", content: q }]); setInput(""); setIsProcessing(true);
    setTimeout(() => { const response = ragPipeline(q); setMessages(prev => [...prev, { role: "assistant", content: response.answer, sources: response.sources, pipeline: response.pipeline }]); setIsProcessing(false); }, 300);
  }, [input]);
  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#0a0e17",color:"#e2e8f0",fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid #1e293b",background:"linear-gradient(180deg, #0f172a 0%, #0a0e17 100%)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg, #0ea5e9, #6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#fff",flexShrink:0}}>ε</div>
          <div><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9",letterSpacing:"-0.02em"}}>Epydemix RAG Assistant</div><div style={{fontSize:11,color:"#64748b",marginTop:1}}>Grounded answers from tutorials, API docs & paper — no hallucinations</div></div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        {messages.length === 0 && (
          <div style={{maxWidth:640,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:32,marginTop:24}}>
              <div style={{fontSize:28,fontWeight:800,background:"linear-gradient(135deg, #38bdf8, #818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8,letterSpacing:"-0.03em"}}>Ask about Epydemix</div>
              <div style={{fontSize:14,color:"#64748b",lineHeight:1.5}}>Questions about epidemic modeling, the EpiModel class, calibration, simulations, and more.</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
              {EXAMPLE_QUESTIONS.map((q,i) => (
                <button key={i} onClick={()=>handleSend(q)} style={{background:"#111827",border:"1px solid #1e293b",borderRadius:10,padding:"12px 16px",color:"#94a3b8",fontSize:13,textAlign:"left",cursor:"pointer",lineHeight:1.4,transition:"all 0.15s",fontFamily:"inherit"}}
                  onMouseOver={e=>{e.currentTarget.style.background="#1e293b";e.currentTarget.style.borderColor="#334155";e.currentTarget.style.color="#e2e8f0";}}
                  onMouseOut={e=>{e.currentTarget.style.background="#111827";e.currentTarget.style.borderColor="#1e293b";e.currentTarget.style.color="#94a3b8";}}>{q}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{maxWidth:720,margin:"0 auto"}}>
          {messages.map((msg,i) => (
            <div key={i} style={{marginBottom:20,display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:msg.role==="user"?"75%":"100%",padding:msg.role==="user"?"10px 16px":"16px 20px",borderRadius:msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:msg.role==="user"?"linear-gradient(135deg, #1d4ed8, #4338ca)":"#111827",border:msg.role==="user"?"none":"1px solid #1e293b",fontSize:14,lineHeight:1.6,color:"#e2e8f0"}}>
                {msg.role==="user" ? msg.content : (<>
                  <FormattedContent text={msg.content} />
                  {msg.sources && msg.sources.length > 0 && (<div style={{marginTop:12,paddingTop:10,borderTop:"1px solid #1e293b"}}>
                    <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4,fontWeight:600}}>Sources</div>
                    {msg.sources.map((s,j) => (<div key={j} style={{fontSize:11,color:"#64748b",lineHeight:1.4}}><span style={{color:"#38bdf8"}}>{s.title}</span>{" — "}{s.source}</div>))}
                  </div>)}
                  {msg.pipeline && <PipelineBadge pipeline={msg.pipeline} />}
                </>)}
              </div>
            </div>
          ))}
          {isProcessing && (<div style={{display:"flex",justifyContent:"flex-start",marginBottom:20}}><div style={{padding:"14px 20px",borderRadius:"16px 16px 16px 4px",background:"#111827",border:"1px solid #1e293b",display:"flex",gap:6,alignItems:"center"}}>{[0,1,2].map(j=>(<div key={j} style={{width:7,height:7,borderRadius:"50%",background:"#38bdf8",animation:`pulse 1.2s ease-in-out ${j*0.15}s infinite`,opacity:0.5}} />))}</div></div>)}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div style={{padding:"12px 20px 16px",borderTop:"1px solid #1e293b",background:"#0a0e17",flexShrink:0}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",gap:10,alignItems:"flex-end"}}>
          <div style={{flex:1,background:"#111827",border:"1px solid #1e293b",borderRadius:14,display:"flex",alignItems:"flex-end",padding:"4px 4px 4px 16px",transition:"border-color 0.15s"}}>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about Epydemix..." rows={1}
              style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e2e8f0",fontSize:14,lineHeight:1.5,resize:"none",padding:"8px 0",fontFamily:"inherit",maxHeight:120}}
              onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}} />
            <button onClick={()=>handleSend()} disabled={!input.trim()||isProcessing}
              style={{width:36,height:36,borderRadius:10,border:"none",background:input.trim()?"linear-gradient(135deg, #0ea5e9, #6366f1)":"#1e293b",color:input.trim()?"#fff":"#475569",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,transition:"all 0.15s"}}>↑</button>
          </div>
        </div>
        <div style={{textAlign:"center",fontSize:10,color:"#334155",marginTop:8,maxWidth:720,margin:"8px auto 0"}}>Answers grounded in Epydemix docs, tutorials, and published paper. No hallucinations.</div>
      </div>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.1); } }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; } ::-webkit-scrollbar-thumb:hover { background: #334155; }
        textarea::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}
